# Development Log - Breakout

Brandon Mitchell
2026.10.28

Claude Opus 4.6

## First Prompt

Within the `breakout` directory:

Read `AGENTS.md`, `SPEC.md`, and `LICENSE` before beginning.

Implement the Breakout game described in `SPEC.md`, following the instructions in `AGENTS.md` and the licensing requirements in `LICENSE`.

Create all necessary application files, including `index.html` and any CSS or JavaScript files you need. Keep the implementation simple and do not introduce external dependencies.

After implementation, summarize the files you created, explain how to run the game, and describe how to test it against the requirements in `SPEC.md`. Be honest about any tests you have not actually performed.

## First Test

(The Agent worked for 2 minutes.)

1. The game opens in a browser without installation or build steps. PASS
2. The player can start the game and move the paddle with the keyboard. FAIL
3. The paddle remains inside the game boundaries. FAIL
4. The ball bounces off the walls and paddle. FAIL
5. Bricks disappear when hit, and the score increases correctly. FAIL
6. Missing the paddle causes the ball to reset without breaking the game. FAIL
7. The game ends after a missed ball. FAIL
8. Destroying all bricks produces a win state. FAIL
9. The player can restart and play a fresh game. FAIL
10. No external dependencies are required. FAIL

## Modified Spec

The game does not work when open the file. According to the Console in Chrome, it gives the following two errors:
``` 
GET file:///run/user/1000/doc/QvY9DvnctQgJQqkcw_Pvnw/style.css
net::ERR_FILE_NOT_FOUND
```
```
GET file:///run/user/1000/doc/QvY9DvnctQgJQqkcw_Pvnw/game.js net::ERR_FILE_NOT_FOUND
```

Claude recognized that I was running Chromium in a Flatpak sandbox, and in response attempted to inline everything into a single index.html file and remove every other file. (The Agent worked for a total of 6s + 1m)

While this *does* fix the issue, it would otherwise go against the requirements of the `SPEC.md` file I provided. So I denied the changes. This was also an error on my part, and was out of the Coding Agent's control. 

I ended up using a native version of FireFox that was installed on my machine, and I asked it to undo the changes it made and restore the two files that were deleted.

(The Agent worked for a total of 4s + 53s)

## Second Test

1. The game opens in a browser without installation or build steps. PASS
2. The player can start the game and move the paddle with the keyboard. PASS
3. The paddle remains inside the game boundaries. PASS
4. The ball bounces off the walls and paddle. PASS
5. Bricks disappear when hit, and the score increases correctly. PASS
6. Missing the paddle causes the ball to reset without breaking the game. PASS
7. The game ends after a missed ball. PASS
8. Destroying all bricks produces a win state. PASS
9. The player can restart and play a fresh game. PASS
10. No external dependencies are required. PASS