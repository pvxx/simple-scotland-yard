# SSY - Simple Scotland Yard (board game)

## About

Scotland Yard is a board game in which a team of players controlling different detectives cooperate to track down a player controlling a criminal as they move around a board representing the streets of London. It was first published in 1983 and is named after Scotland Yard which is the headquarters of London's Metropolitan Police Service in real-life. Scotland Yard is an asymmetric board game, during which the detective players cooperatively solve a variant of the pursuit–evasion problem. The game is published by Ravensburger in most of Europe and Canada and by Milton Bradley in the United States. It received the Spiel des Jahres (Game of the Year) award in 1983, the same year that it was published. (From [Wikipedia](https://en.wikipedia.org/wiki/Scotland_Yard_%28board_game%29))

There are many resources explaining the game and rules, for a short and clear instruction see for example [here](https://github.com/step-8/scotland-yard-byomkesh/wiki).

## Why

I enjoy playing this game with my friends or family members and most of the time the best opportunity is on holidays, in some hotel room or other accomodation. Carrying the box with board game is bothersome and today everywhere you go there is a huge TV, just begging to be used :).

There are lots of different implementations of this game, most of them for online play or playing against AI and all requiring installation on server and/or locally.

My goal was to allow playing as fast as possible, for a group of physical humans :), preferably without installing anything. The obvious solution is a single-page web, that can be used from TV in-build web browser or if needed by connecting some device (notebook or mobile phone) as TV input.

All the gameplay is in the open, the only thing to keep secret are moves of Mr. X. I solved this by encoding his possible moves as letters and displaying QR code with "code table". This way the player playing Mr. X just has to scan the code and then make his move by selecting a letter, that doesn't give any information to the other players (detectives).

## Play

To play with default configuration just open [ssy page](...) in a browser. All gameplay is done using javascript in browser, configuration and status are stored in browser localstorage (cookies). Nothing is sent to the server.

Short info is shown every time you open the page (and can be shown again by clicking on "SSY" title in game window).

When starting the game for the first time, setup the UI first - TVs have different defaults and quirks (for example many 4K TVs still render web in HD), so you can setup size (zoom) of all elements.

Mr. X moves are shown as QR code, some basic precautions are made against "side channel" information - full alphabet is shown every time, even if only some letters are valid moves, empty items are added to "code table" for the code to always be roughly the same size, etc. Any QR scanner app should work, including Google Lens, I personally recommend using a good one, like [Barcode Scanner by Atharok](https://gitlab.com/Atharok/BarcodeScanner).

## Install and customize

Installing on your own server is simple, just copy all files into empty webserver-accessible directory. In this case you can modify the game configuration.

All game settings are stored in config.js file:

* player names
* basic rules (transport ticket counts, when to show Mr. X position, maximum number of moves, etc.)
* UI (language strings for all texts, visual setup defaults)
* board (icons of pieces in SVG format, board image, nodes and moves, starting positions for detectives and Mr. X)

You can modify them as you wish, if you create a config useful for others (especially icons and/or board, different language), send it to me (open issue) and I may include it here.

## Help

I'm not an graphic designer and the UI looks the part ;). Any help with visuals would be very welcome, especially piece icons and game window appearance (an image is enough, I can do CSS myself), provided it remains functional and reasonably minimalist.
