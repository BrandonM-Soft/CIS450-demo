"""
findcoins.py — US Coin Detection, Classification, and Valuation using OpenCV

Algorithm overview:
  1. Pre-process: bilateral filter → grayscale → adaptive threshold OR
     Canny edges → morphological close/open to clean up.
  2. Find contours, filter by area and circularity to keep only coin-shaped
     blobs.
  3. Fit minimum enclosing circles to each qualifying contour.
  4. Merge overlapping detections.
  5. Classify each coin using a two-phase approach:
     a) Phase 1 — identify pennies via HSV copper-hue analysis.
     b) Phase 2 — use the average penny radius as a known reference
        (penny = 19.05 mm) to compute a px-per-mm scale, then classify
        silver coins by their expected real-world diameter:
          Quarter 24.26 mm → 1.273× penny radius
          Nickel  21.21 mm → 1.113× penny radius
          Dime    17.91 mm → 0.940× penny radius
     c) Fallback — when no pennies are detected, use relative radius
        with edge-texture analysis to distinguish reeded-edge coins
        (quarter, dime) from smooth-edge coins (nickel).
  6. Annotate with semi-transparent coloured circle overlays and labels
     fitted inside each coin.  Save result images.
"""

import cv2
import numpy as np
import os
import sys


# ---------------------------------------------------------------------------
# Coin value map (in cents) and display colours (BGR)
# ---------------------------------------------------------------------------
COIN_VALUES = {"Quarter": 25, "Nickel": 5, "Dime": 10, "Penny": 1}
COIN_COLORS = {
    "Quarter": (255, 50, 50),    # blue
    "Nickel":  (50, 200, 50),    # green
    "Dime":    (0, 165, 255),    # orange
    "Penny":   (0, 0, 255),      # red
}

# Real US coin diameters (mm)
COIN_DIAMETERS_MM = {
    "Quarter": 24.26,
    "Nickel":  21.21,
    "Penny":   19.05,
    "Dime":    17.91,
}

# Ratios to penny diameter (used in penny-reference classification)
_RATIO_QUARTER = COIN_DIAMETERS_MM["Quarter"] / COIN_DIAMETERS_MM["Penny"]  # 1.273
_RATIO_NICKEL  = COIN_DIAMETERS_MM["Nickel"]  / COIN_DIAMETERS_MM["Penny"]  # 1.113
_RATIO_DIME    = COIN_DIAMETERS_MM["Dime"]    / COIN_DIAMETERS_MM["Penny"]  # 0.940

# Decision boundaries (adjusted slightly from pure midpoints to account
# for circle-detection noise — a coin at ~1.0× penny radius is more likely
# a nickel (expected 1.113×) than a dime (expected 0.940×)).
_BOUNDARY_Q_N = (_RATIO_QUARTER + _RATIO_NICKEL) / 2   # ≈ 1.193
_BOUNDARY_N_D = 0.97   # shifted from midpoint (1.027) to be more tolerant


# ---------------------------------------------------------------------------
# Colour analysis: is the coin copper-coloured?
# ---------------------------------------------------------------------------
def is_copper(image_bgr, cx, cy, radius):
    """
    Sample a disc inside the coin and check if it's predominantly copper
    (orange-brown hue in HSV).
    """
    h_img, w_img = image_bgr.shape[:2]
    sr = max(int(radius * 0.35), 3)
    y1 = max(cy - sr, 0); y2 = min(cy + sr, h_img)
    x1 = max(cx - sr, 0); x2 = min(cx + sr, w_img)
    patch = image_bgr[y1:y2, x1:x2]
    if patch.size == 0:
        return False

    hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)

    # Circular mask
    ph, pw = patch.shape[:2]
    Y, X = np.ogrid[:ph, :pw]
    dist = np.sqrt((X - pw // 2) ** 2 + (Y - ph // 2) ** 2)
    cmask = (dist <= sr).astype(np.uint8)

    # Copper hue range
    lower = np.array([4, 30, 50])
    upper = np.array([25, 255, 255])
    hmask = cv2.inRange(hsv, lower, upper)
    combined = cv2.bitwise_and(hmask, hmask, mask=cmask)
    total = max(np.count_nonzero(cmask), 1)
    return np.count_nonzero(combined) / total > 0.20


# ---------------------------------------------------------------------------
# Edge-texture analysis: does the coin have a reeded (ridged) edge?
# Quarters and dimes have reeded edges; nickels and pennies are smooth.
# ---------------------------------------------------------------------------
def _edge_roughness(gray, cx, cy, radius):
    """
    Sample intensity values around the coin's circumference and return a
    roughness score.  High roughness → reeded edge (quarter / dime).
    """
    h_img, w_img = gray.shape[:2]
    n_points = 180
    # Sample at 98% of the radius to catch the edge region
    r_sample = int(radius * 0.98)
    angles = np.linspace(0, 2 * np.pi, n_points, endpoint=False)
    values = []
    for a in angles:
        x = int(cx + r_sample * np.cos(a))
        y = int(cy + r_sample * np.sin(a))
        if 0 <= x < w_img and 0 <= y < h_img:
            values.append(float(gray[y, x]))
    if len(values) < 60:
        return 0.0
    arr = np.array(values)
    # High-frequency variation: std of consecutive differences
    return float(np.std(np.diff(arr)))


# ---------------------------------------------------------------------------
# Core detection pipeline
# ---------------------------------------------------------------------------
def detect_coins(image_path):
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: could not read {image_path}")
        return None, []

    h_img, w_img = img.shape[:2]
    min_dim = min(h_img, w_img)

    # Plausible coin radius bounds (pixels)
    r_min = max(int(min_dim * 0.035), 12)
    r_max = int(min_dim * 0.30)
    area_min = np.pi * r_min ** 2 * 0.5
    area_max = np.pi * r_max ** 2 * 1.5

    # Strategy A: contour-based detection
    coins_a = _detect_via_contours(img, area_min, area_max, r_min, r_max)

    # Strategy B: HoughCircles backup
    coins_b = _detect_via_hough(img, r_min, r_max, min_dim)

    # Merge and deduplicate
    all_raw = _merge_circle_lists(coins_a + coins_b)

    if not all_raw:
        print(f"  No coins detected in {image_path}")
        return img, []

    # Classify using two-phase approach
    classified = _classify_coins(img, all_raw)
    return img, classified


# ---------------------------------------------------------------------------
# Contour-based detection
# ---------------------------------------------------------------------------
def _detect_via_contours(img, area_min, area_max, r_min, r_max):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    filtered = cv2.bilateralFilter(gray, 11, 85, 85)

    circles = []

    # Strategy 1: Adaptive threshold
    adapt = cv2.adaptiveThreshold(
        filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 31, 5)
    circles += _contours_to_circles(adapt, area_min, area_max, r_min, r_max)

    # Strategy 2: Otsu threshold
    _, otsu = cv2.threshold(
        filtered, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    circles += _contours_to_circles(otsu, area_min, area_max, r_min, r_max)

    # Strategy 3: Canny edges → dilate
    edges = cv2.Canny(filtered, 30, 100)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    dilated = cv2.dilate(edges, kernel, iterations=2)
    circles += _contours_to_circles(dilated, area_min, area_max, r_min, r_max)

    return _merge_circle_lists(circles)


def _contours_to_circles(binary, area_min, area_max, r_min, r_max):
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel, iterations=1)

    contours, _ = cv2.findContours(
        cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    result = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < area_min or area > area_max:
            continue
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue
        circularity = 4 * np.pi * area / (perimeter * perimeter)
        if circularity < 0.55:
            continue
        (cx, cy), radius = cv2.minEnclosingCircle(cnt)
        enclosing_area = np.pi * radius * radius
        fill = area / max(enclosing_area, 1)
        if fill < 0.45:
            continue
        if r_min <= radius <= r_max:
            result.append((int(cx), int(cy), int(radius)))
    return result


# ---------------------------------------------------------------------------
# HoughCircles backup detection
# ---------------------------------------------------------------------------
def _detect_via_hough(img, r_min, r_max, min_dim):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    filtered = cv2.bilateralFilter(gray, 11, 85, 85)
    blurred = cv2.medianBlur(filtered, 7)

    min_dist = max(int(r_min * 2.5), 30)
    circles = cv2.HoughCircles(
        blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=min_dist,
        param1=120, param2=50,
        minRadius=r_min, maxRadius=r_max)
    if circles is None:
        return []
    return [(int(c[0]), int(c[1]), int(c[2])) for c in circles[0]]


# ---------------------------------------------------------------------------
# Circle deduplication
# ---------------------------------------------------------------------------
def _merge_circle_lists(circles):
    if not circles:
        return []
    circles = sorted(circles, key=lambda c: c[2], reverse=True)
    keep = [True] * len(circles)
    for i in range(len(circles)):
        if not keep[i]:
            continue
        for j in range(i + 1, len(circles)):
            if not keep[j]:
                continue
            dx = circles[i][0] - circles[j][0]
            dy = circles[i][1] - circles[j][1]
            dist = np.sqrt(dx * dx + dy * dy)
            r_small = min(circles[i][2], circles[j][2])
            if dist < r_small * 1.0:
                keep[j] = False
    return [circles[i] for i in range(len(circles)) if keep[i]]


# ---------------------------------------------------------------------------
# Two-phase classification
# ---------------------------------------------------------------------------
def _classify_coins(img, coins_raw):
    """
    Phase 1: Identify pennies by copper hue.
    Phase 2: Use median penny radius as a reference scale to classify
             silver coins by real-world diameter ratios.
    Fallback: If no pennies, use relative sizing + edge-roughness.
    """
    n = len(coins_raw)
    copper_flags = [is_copper(img, cx, cy, r) for (cx, cy, r) in coins_raw]
    penny_radii = [coins_raw[i][2] for i in range(n) if copper_flags[i]]

    results = [None] * n

    # Mark all copper coins as pennies
    for i in range(n):
        if copper_flags[i]:
            results[i] = "Penny"

    silver_indices = [i for i in range(n) if not copper_flags[i]]

    if penny_radii and silver_indices:
        # --- Penny-reference classification ---
        ref_r = float(np.median(penny_radii))
        for i in silver_indices:
            _, _, r = coins_raw[i]
            ratio = r / ref_r
            if ratio > _BOUNDARY_Q_N:       # > ~1.193
                results[i] = "Quarter"
            elif ratio > _BOUNDARY_N_D:     # > ~1.027
                results[i] = "Nickel"
            else:
                results[i] = "Dime"

    elif silver_indices:
        # --- No pennies: relative sizing + edge roughness ---
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        silver_radii = [coins_raw[i][2] for i in silver_indices]
        max_r = float(max(silver_radii))
        min_r = float(min(silver_radii))
        spread = (max_r - min_r) / max_r if max_r > 0 else 0

        for i in silver_indices:
            cx, cy, r = coins_raw[i]
            ratio = r / max_r if max_r > 0 else 1.0
            roughness = _edge_roughness(gray, cx, cy, r)

            if spread < 0.08:
                # All similar size — use edge roughness as tiebreaker
                # Reeded edge → quarter or dime; smooth → nickel
                results[i] = "Quarter" if roughness > 18 else "Nickel"
            else:
                if ratio > 0.92:
                    results[i] = "Quarter"
                elif ratio > 0.82:
                    results[i] = "Nickel"
                elif ratio > 0.70:
                    results[i] = "Nickel" if ratio > 0.76 else "Dime"
                else:
                    results[i] = "Dime"

    return [(coins_raw[i][0], coins_raw[i][1], coins_raw[i][2], results[i])
            for i in range(n)]


# ---------------------------------------------------------------------------
# Annotation — labels fitted inside coloured circle overlays
# ---------------------------------------------------------------------------
def annotate_image(img, coins):
    h_img, w_img = img.shape[:2]
    sf = min(h_img, w_img) / 500.0
    circle_thick = max(2, int(2.5 * sf))
    font = cv2.FONT_HERSHEY_SIMPLEX

    total_cents = 0
    counts = {k: 0 for k in COIN_VALUES}

    # Tally
    for (_, _, _, ctype) in coins:
        total_cents += COIN_VALUES[ctype]
        counts[ctype] += 1

    # --- Phase 1: semi-transparent filled circles ---
    overlay = img.copy()
    for (cx, cy, r, ctype) in coins:
        cv2.circle(overlay, (cx, cy), r, COIN_COLORS[ctype], -1)
    cv2.addWeighted(overlay, 0.35, img, 0.65, 0, img)

    # --- Phase 2: circle outlines + fitted labels ---
    for (cx, cy, r, ctype) in coins:
        color = COIN_COLORS[ctype]
        cv2.circle(img, (cx, cy), r, color, circle_thick)

        # Determine label text — try full name first, abbreviate if needed
        label = ctype
        max_w = int(r * 1.4)     # usable width inside circle
        max_h = int(r * 0.7)     # usable height

        best_scale = _fit_font_scale(label, font, max_w, max_h)

        if best_scale < 0.25:
            # Circle too small for full name — use single letter
            abbrev = {"Quarter": "Q", "Nickel": "N", "Dime": "D", "Penny": "P"}
            label = abbrev[ctype]
            best_scale = _fit_font_scale(label, font, max_w, max_h)

        thick_text = max(1, round(best_scale * 1.8))
        (tw, th), _ = cv2.getTextSize(label, font, best_scale, thick_text)
        tx = cx - tw // 2
        ty = cy + th // 2

        # Black outline for contrast, then white fill
        cv2.putText(img, label, (tx, ty), font, best_scale,
                    (0, 0, 0), thick_text + 2, cv2.LINE_AA)
        cv2.putText(img, label, (tx, ty), font, best_scale,
                    (255, 255, 255), thick_text, cv2.LINE_AA)

    # --- Summary overlay (bottom-left) ---
    total_dollars = total_cents / 100.0
    lines = [
        f"Coins detected: {len(coins)}",
        f"  Quarters: {counts['Quarter']}",
        f"  Nickels:  {counts['Nickel']}",
        f"  Dimes:    {counts['Dime']}",
        f"  Pennies:  {counts['Penny']}",
        f"Total: ${total_dollars:.2f}",
    ]
    s_scale = max(0.45, 0.55 * sf)
    s_thick = max(1, int(1.5 * sf))
    lh = int(22 * sf)
    bw = int(220 * sf)
    bh = lh * len(lines) + int(16 * sf)
    bx, by = 8, h_img - bh - 8

    ov2 = img.copy()
    cv2.rectangle(ov2, (bx, by), (bx + bw, by + bh), (0, 0, 0), -1)
    cv2.addWeighted(ov2, 0.65, img, 0.35, 0, img)
    for i, line in enumerate(lines):
        y = by + int(18 * sf) + i * lh
        cv2.putText(img, line, (bx + 6, y), font, s_scale,
                    (255, 255, 255), s_thick, cv2.LINE_AA)

    return total_cents


def _fit_font_scale(text, font, max_w, max_h):
    """Binary-search for the largest font scale that fits in max_w × max_h."""
    lo, hi, best = 0.2, 4.0, 0.2
    for _ in range(20):
        mid = (lo + hi) / 2
        (tw, th), _ = cv2.getTextSize(text, font, mid, max(1, round(mid * 1.8)))
        if tw <= max_w and th <= max_h:
            best = mid
            lo = mid
        else:
            hi = mid
    return best


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    image_files = sorted(
        f for f in os.listdir(script_dir)
        if f.lower().startswith("coins") and f.lower().endswith(".png")
        and "result" not in f.lower()
    )
    if not image_files:
        print("No coin images found in", script_dir)
        sys.exit(1)

    grand_total = 0
    for fname in image_files:
        fpath = os.path.join(script_dir, fname)
        print(f"\nProcessing: {fname}")
        print("-" * 40)

        img, coins = detect_coins(fpath)
        if img is None:
            continue

        total = annotate_image(img, coins)
        grand_total += total

        counts = {}
        for (_, _, _, ct) in coins:
            counts[ct] = counts.get(ct, 0) + 1
        print(f"  Coins detected : {len(coins)}")
        for ctype in ["Quarter", "Nickel", "Dime", "Penny"]:
            print(f"    {ctype:8s}: {counts.get(ctype, 0)}")
        print(f"  Image total    : ${total / 100:.2f}")

        base, ext = os.path.splitext(fname)
        out_name = f"{base}_result{ext}"
        out_path = os.path.join(script_dir, out_name)
        cv2.imwrite(out_path, img)
        print(f"  Saved          : {out_name}")

    print(f"\n{'=' * 40}")
    print(f"Grand total across all images: ${grand_total / 100:.2f}")


if __name__ == "__main__":
    main()
