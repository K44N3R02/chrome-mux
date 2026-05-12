# Chrome Mux

Chrome Mux is a simple, hand-written session manager, inspired by qutebrowser's sessions and ThePrimeagen's tmux-sessionizer.

## Install

Requirements:
- Any Chromium based browser

Steps:
1. `git clone https://github.com/K44N3R02/chrome-mux`
2. Open `chrome://extensions` (or its equivalent in your browser).
3. Enable "Developer mode" from top-right toggle.
4. Click "Load unpacked".
5. Select the cloned directory.

## Usage

Pressing `Ctrl+K` (`Cmd+K` on MacOS) opens plugin popup. A search bar and a list of existing sessions will appear. List of sessions will be filtered as you type a session name. Pressing enter will save the current windows and tabs to the last active session and open the topmost session in suggestion list.

To create a new session, write the new session name and press enter. This will save the current windows and tabs to this new session without changing your previously active session.

Buttons:
- "Save" button will save the current tabs and windows to the active session.
- "Load (w/ Save)" button has the same effect with pressing enter on search bar.
- "Load (no Save)" button opens the top suggested session without saving the changes to the active session.
- "Quick Switch" button saves the current tabs and windows, then opens your previous session.
- "Settings" button opens a settings page.

## Options

If you want to save your incognito/private windows to sessions, enable "Allow in Private" from extension details.

## Credits
- "Processor" icon by [Lorc](https://game-icons.net/1x1/lorc/processor.html) under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/).
- Fuzzy search algorithm is inspired by [fzf](https://github.com/junegunn/fzf)'s "FuzzyMatchV1" algorithm.

