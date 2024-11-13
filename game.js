// *** main {{{

// * var defs {{{
ssy_var = {
    'config': {
        'nodepos': [],
        'nodemov': [],
        'nodestart_d': [],
        'nodestart_x': [],
    },
    'ui': {},
    'state': {},
}
// * var defs }}}

ssy_init = function() // init page, load running game if any {{{
{
    // hide ui items
    $('#setupwrap, #movelist, #movewrap, #replay, #config').hide();

    // ** init config {{{

    // load start positions
    var rows = ssy_cfg.board.map.startpos_d.trim().split('\n');
    for(var row in rows)
    {
        ssy_var.config.nodestart_d.push(parseInt(rows[row]));
    }
    var rows = ssy_cfg.board.map.startpos_x.trim().split('\n');
    for(var row in rows)
    {
        ssy_var.config.nodestart_x.push(parseInt(rows[row]));
    }
    // load nodes
    var rows = ssy_cfg.board.map.nodes.trim().split('\n');
    for(var row in rows)
    {
        var itm = rows[row].split(' ');
        ssy_var.config.nodepos[parseInt(itm[0])] = [parseInt(itm[1]), parseInt(itm[2])];
        ssy_var.config.nodemov[parseInt(itm[0])] = [];
    }
    // load moves
    var rows = ssy_cfg.board.map.moves.trim().split('\n');
    for(var row in rows)
    {
        var itm = rows[row].split(' ');
        ssy_var.config.nodemov[parseInt(itm[0])].push(itm[2] + itm[1]);
        ssy_var.config.nodemov[parseInt(itm[1])].push(itm[2] + itm[0]);
    }

    ssy_var.store = ssy_cfg.ui.save;

    // ** init config }}}

    // init UI config
    ssy_var.ui = {...ssy_cfg.ui.defaults};

    // empty state
    ssy_var.state = {};

    // overwrite ui config from localstorage, if any
    var local = ssy_local_get('ui');
    if(local)
    {
        ssy_var.ui = local;
    }

    // ** setup setup :) {{{
    var sbtn = {
        'd2': '--',
        'd1': '-',
        'u1': '+',
        'u2': '++',
    }
    var scnt = '<div id="ui-visual">';
    for(i in ssy_var.ui.visual)
    {
        scnt += '<h4>' + ssy_cfg.ui.lng['ui_visual_' + i] + ': <span id="' + i + '-val">' + ssy_var.ui.visual[i] +  '</span></h4>';
        for(var bi in sbtn)
        {
            scnt += '<button id="' + i + '-' + bi + '">' + sbtn[bi] + '</button>';
        }
    }
    scnt += '</div>';
    $('#ui-visual').html(scnt);

    // ** setup setup :) }}}

    // ** board setup {{{

    // create elements for players
    // must be added all at once, otherwise jquery messes up self-closed tags
    var svgcnt = '<defs>';
    var movetbl = '';
    for(var i = 0; i < ssy_cfg.players.length; i++)
    {
        // create tags for every player with piece (use href) name and his position
        var itm = ssy_cfg.board.pieces.icons[i].split('|', 2);
        svgcnt += '<symbol id="i-p' + i + '" viewBox="' + itm[0] + '">' + itm[1] + '</symbol>';
        movetbl += '<li><svg viewBox="' + itm[0] + '"><use href="#i-p' + i + '"/></svg></li>';
        $('#map').append('<svg id="p' + i + '" title="' + ssy_cfg.players[i]+ '" class="player" viewBox="' + itm[0] + '"><use href="#i-p' + i + '"/></svg>');
        $('#playerpos').append('<p id="pos' + i + '"><svg viewBox="' + itm[0] + '"><use href="#i-p' + i + '"/></svg> ' + ssy_cfg.players[i]+ ' <b>0</b></p>');
    }
    svgcnt += '</defs>';
    $('#svgs').html(svgcnt);
    $('#movetbl_h').html(movetbl);
    $('#p0').hide();

    // set board
    $('#map').css({
        //!'filter': 'opacity()',
    });

    // set language strings
    $('.lng').each(function(index)
    {
        $(this).html(ssy_cfg.ui.lng[$(this).attr('id')]);
    });

    // ** board setup }}}

    ssy_ui_redraw(true);

    // ** setup running game, if any {{{

    // overwrite state from localstorage, if any
    var local = ssy_local_get('state');
    if(local)
    {
        ssy_var.state = local;
    }

    if(ssy_var.state.cur.what)
    {
        // write history
        ssy_ui_tomoves('history');
        // show ui
        $('#movelist, #movewrap').show();
        if(ssy_var.state.cur.what == 'play')
        {
            // go next move
            ssy_step();
        }
        else if(ssy_var.state.cur.what == 'end')
        {
            $('#move, #go').hide();
            $('#move-x, #move-2').hide();
            $('#replay').show();
            ssy_ui_redraw(true);
        }
    }
    // ** setup running game, if any }}}
} // }}}

ssy_start = function() // start new game {{{
{
    // randomize initial positions
    var spos = [...ssy_var.config.nodestart_d];
    ssy_int_array_shuffle(spos);
    spos = spos.slice(0, ssy_cfg.players.length);
    // set X position
    spos[0] = ssy_var.config.nodestart_x[Math.floor(Math.random() * ssy_var.config.nodestart_x.length)];

    // init state for new game
    ssy_var.state = {
        'cur': {
            'what': 'play',
            'round': 1,
            'player': -1,
        },
        // last time X used 2-move (= not allowed next 2 moves; start with -2 to allow use from first move)
        'last2': -2,
        'moves': {},
        'pos': spos,
        // prefix all positions with '.' ("no transport")
        'history': [spos.map((item, i) => { return '.' + item; })],
    };

    ssy_var.state.moves[0] = {...ssy_cfg.rules.moves_x};

    for(var i = 1; i < ssy_cfg.players.length; i++)
    {
        ssy_var.state.moves[i] = {...ssy_cfg.rules.moves_d};
    }

    // empty item to store first move
    ssy_var.state.history[1] = [];

    ssy_ui_tomoves('history');
    $('#movelist, #movewrap, #move, #go').show();
    $('#replay').hide();

    ssy_step();
} // }}}

ssy_step = function() // show next game step {{{
{
    var curs = ssy_var.state.cur;

    // set next player
    curs.player++;
    if (curs.player == ssy_cfg.players.length)
    {
        curs.player = 0;
        // increase move number if all moved
        curs.round++;
        // init history
        ssy_var.state.history[curs.round] = [];
        // new line to move list
        ssy_ui_tomoves('line');
    }

    // * check for game over

    if(
        // someone else is on X position
        ([...ssy_var.state.pos].slice(1).includes(ssy_var.state.pos[0]))
        // no possible moves for X
        || (ssy_int_possible_moves(0, ssy_var.state.pos[0]).length == 0)
    )
    {
        ssy_ui_message('msg_mrx_lost');
        ssy_var.state.cur.what = 'end';
    }

    // !! no possible moves for player(?)
    // move limit reached
    if(ssy_var.state.cur.round > ssy_cfg.rules.maxmoves)
    {
        ssy_ui_message('msg_mrx_won');
        ssy_var.state.cur.what = 'end';
    }

    if(ssy_var.state.cur.what == 'end')
    {
        // show full history (including X moves)
        ssy_ui_tomoves('history');
        $('#move, #go').hide();
        $('#replay').show();
        ssy_local_store('state');
    }
    else
    {
        // set possible moves
        ssy_ui_fillmove(curs.player, ssy_var.state.pos[curs.player]);
    }

    ssy_ui_redraw();

} // }}}

ssy_move = function() // do move {{{
{
    var player = ssy_var.state.cur.player;
    var round = ssy_var.state.cur.round;
    var move = $('#move').val();

    if(move == '')
    {
        // warn somehow?
        return false;
    }

    // X: use X-move
    if($('#move-x').hasClass('sel'))
    {
        $('#move-x').removeClass('sel');
        move = 'X' + move.substring(1);
    }

    // set new position
    ssy_var.state.pos[player] = parseInt(move.substring(1));

    // store into history
    ssy_var.state.history[round][player] = move;

    // put into move list
    ssy_ui_tomoves(ssy_int_move_display(player, round, ssy_int_x_shown(round)));

    // decrement move type
    if(move.charAt(0) != '.')
    {
        ssy_var.state.moves[player][move.charAt(0)]--;
    }

    // X: use 2-move
    if($('#move-2').hasClass('sel'))
    {
        $('#move-2').removeClass('sel');

        ssy_var.state.last2 = ssy_var.state.cur.round;

        // decrement move
        ssy_var.state.moves[player]['2']--;

        // fill history of other players from previous move
        ssy_var.state.history[ssy_var.state.cur.round] = ssy_var.state.history[ssy_var.state.cur.round]
            .concat(ssy_var.state.history[ssy_var.state.cur.round - 1].slice(1)
                .map((item) => { return '.' + item.substring(1); }));

        // pretend this move was with the last player (so that next move will be started by ssy_step)
        ssy_var.state.cur.player = ssy_cfg.players.length - 1;
    }

    // store locally
    ssy_local_store('state');

    ssy_step();
} // }}}

ssy_replay = function(round) // replay given round (after game ends) {{{
{
    // set round
    ssy_var.state.cur.round = round;

    // update moveinfo
    $('#moveinfo').html('<h4>' + ssy_cfg.ui.lng.round + ': ' + round + '</h4>');

    // take positions in this round from history
    var rpos = ssy_var.state.history[round];

    // if not full round (may happen in last one), append from previous
    if(rpos.length < ssy_cfg.players.length)
    {
        rpos = rpos.concat(ssy_var.state.history[round - 1].slice(rpos.length));
    }

    // fill current positions from history (!!! extra handling for last round with incomplete positions (copy from previous to last))
    ssy_var.state.pos = rpos.map((item) => { return parseInt(item.substring(1)); });

    ssy_ui_redraw();
} // }}}

// *** main }}}

// *** helper {{{

ssy_ui_redraw = function(all = false) // redraw board from current status {{{
{
    // if something is set
    if(ssy_var.state.pos)
    {
        var curs = ssy_var.state.cur;
        // for X the previous move must be checked, not to show his current move and to show it during double-move
        var x_shown = ssy_int_x_shown(curs.round - (curs.player == 0 ? 1 : 0));

        // set position of each player
        for(var i = 0; i < ssy_cfg.players.length; i++)
        {
            var npos = ssy_var.config.nodepos[ssy_var.state.pos[i]];
            // animate later?
            $('#p' + i).css({
                'top': ((npos[1] - ssy_cfg.board.pieces.center_y) * ssy_var.ui.visual.board) + 'px',
                'left': ((npos[0] - ssy_cfg.board.pieces.center_x) * ssy_var.ui.visual.board) + 'px',
            });
            $('#pos' + i + ' b').html(ssy_int_move_display(i, curs.round, x_shown).substring(1));
        }
        if(curs.what == 'play')
        {
            $('#pos' + curs.player).addClass('cur').siblings().removeClass('cur');
            $('#p' + curs.player).addClass('cur').siblings().removeClass('cur');
        }
        else
        {
            // no current player outside of 'play'
            $('.player, #playerpos p').removeClass('cur');
        }
        // show X on selected moves
        $('#p0').toggle(x_shown);
    }

    // this is needed only after UI setup
    if(all)
    {
        // calc background image brightness to use in CSS (ignore values above 1)
        var bib = 1 - Math.min(ssy_var.ui.visual.bright, 1);
        // set board
        $('#map').css({
            'background-image': 'linear-gradient(rgba(255,255,255,' + bib + '), rgba(255,255,255,' + bib + ')), url(' + ssy_cfg.board.map.file + ')',
            'width': ssy_cfg.board.map.width * ssy_var.ui.visual.board,
            'height': ssy_cfg.board.map.height * ssy_var.ui.visual.board,
        })
        // set players
        $('.player').css({
            'width': ssy_cfg.board.pieces.width * ssy_var.ui.visual.board,
        });
        // set ui text
        $('#play').css({
            'font-size': (100 * ssy_var.ui.visual.text) + '%',
        })
        $('button, select').css({
            'font-size': (100 * ssy_var.ui.visual.buttons) + '%',
        })
    }
} // }}}

ssy_ui_fillmove = function(player, pos) // fill possible moves {{{
{
    var moves = ssy_var.state.moves[player];
    var possible = ssy_int_possible_moves(player, pos);
    var showhow = ssy_cfg.rules.showhow;
    var mvout = '', out = '<h4>' + ssy_cfg.ui.lng.round + ': ' + ssy_var.state.cur.round + '</h4>';
    var qrmsg = '';

    // if no possible moves, show current
    if(possible.length == 0)
    {
        possible.push('.' + pos);
    }

    // show current move info
    for(var item in moves)
    {
        mvout += item + ': ' + moves[item] + '; ';
    }

    // hide X-special moves by default
    $('#move-x, #move-2').hide();

    // for X anonymize and show QR code
    if(player == 0)
    {
        // show extra buttons if still possible
        $('#move-x').toggle(ssy_var.state.moves[0]['X'] > 0);
        $('#move-2').toggle((ssy_var.state.moves[0]['2'] > 0) && (ssy_var.state.last2 + 2 < ssy_var.state.cur.round));

        qrmsg = '=> ' + ssy_var.state.pos[player] + '\n';
        if(!showhow)
        {
            qrmsg += mvout + '\n';
        }
        var pos_num = possible.length;
        // pad to 20 (should be enough)
        possible = possible.concat(Array(20 - pos_num).fill(''));
        // randomize order
        ssy_int_array_shuffle(possible);

        for(const[i, item] of possible.entries())
        {
            if(item != '')
            {
                qrmsg += String.fromCharCode(65 + i) + '=' + item + '\n';
            }
        }
        // "pad" QR code so that number of possible moves cannot be guessed :)
        qrmsg += '-:---\n'.repeat(20 - pos_num);
    }

    if(showhow)
    {
        out += mvout;
    }
    $('#moveinfo').html(out);

    ssy_ui_qr(qrmsg);

    // fill
    out = '<option value="">---</option>';
    for(const[i, item] of possible.entries())
    {
        out += '<option value="' + item + '">'
            + ((player == 0)
                ? String.fromCharCode(65 + i )
                : item.substring(1) + ' (' + ssy_cfg.ui.lng[item.charAt(0)] + ')'
            )
            + '</option>';
    }
    $('#move').html(out);
} // }}}

ssy_ui_tomoves = function(val) // add value to UI history {{{
{
    // special value for new line
    if(val == 'line')
    {
        $('#movetbl').prepend('<ul></ul>');
    }
    // special value for whole history
    else if(val == 'history')
    {
        var mcnt = '';
        var hist = ssy_var.state.history;
        for(var h_round = hist.length - 1; h_round >= 0; h_round--)
        {
            mcnt += '<ul>';
            for(var h_player = 0; h_player < hist[h_round].length; h_player++)
            {
                mcnt += ssy_ui_fmtmove(ssy_int_move_display(h_player, h_round, ssy_int_x_shown(h_round)));
            }
            mcnt += '</ul>';
        }

        $('#movetbl').html(mcnt);
    }
    // default just add new value
    else
    {
        $('#movetbl ul:first').append(ssy_ui_fmtmove(val));
    }
} // }}}

ssy_ui_fmtmove = function(mmov, tag = 'li') // format move for output {{{
{
    // add move letter as class
    return '<' + tag + ' class="m_' + mmov[0] + '">' + mmov + '</' + tag + '>';
} // }}}

ssy_ui_qr = function(msg) // show qr code with content {{{
{
    var qrcnt = '';

    if(msg != '')
    {
        qrcnt = QRCode({'msg': msg, 'dim': '100%'});
    }

    $('#qrmove').html(qrcnt);
} // }}}

ssy_ui_message = function(msgid) // show message {{{
{
    alert(ssy_cfg.ui.lng[msgid]);
} // }}}

ssy_int_possible_moves = function(player, pos) // return possible moves for player {{{
{
    var moves = ssy_var.state.moves[player];
    // remove X position
    var occupied = [...ssy_var.state.pos].slice(1);

    // get possible moves, filter out non-available transport and occupied by someone else (except X)
    return ssy_var.config.nodemov[pos].filter((x) => ((moves[x.charAt(0)] || 0) != 0) && (!occupied.includes(parseInt(x.substring(1)))));
} // }}}

ssy_int_array_shuffle = function(array) // shufle (randomize) array elements {{{
{
    for (let i = array.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
} // }}}

ssy_int_x_shown = function(round) // return whether X should be shown on this round {{{
{
    return ssy_cfg.rules.checkmoves.includes(round) || ssy_var.state.cur.what != 'play';
} // }}}

ssy_int_move_display = function(player, round, x_shown) // return string representing move of player in given round {{{
{
    // last position (from history)
    var lpos = ssy_var.state.history[round][player] || ssy_var.state.history[round - 1][player];
    return (player != 0 || x_shown) ? lpos : (ssy_cfg.rules.showhow ? lpos.charAt(0) : '') + '--';
} // }}}

ssy_local_store = function(what, value) // store game/setup into localstorage {{{
{
    if(ssy_var.store)
    {
        try
        {
            localStorage.setItem('ssy_' + what, JSON.stringify(ssy_var[what]));
        }
        catch(e)
        {
            ssy_var.store = false;
            // alert user
            ssy_ui_message('msg_sys_nostorage');
        }
    }
    // no need to return, should never be fatal
} // }}}

ssy_local_get = function(what) // retrieve game/setup from localstorage {{{
{
    var ret;

    try
    {
        ret = localStorage.getItem('ssy_' + what);
        if(ret)
        {
            return JSON.parse(ret);
        }
    }
    catch(e)
    {
        return false;
    }
} // }}}

// *** helper }}}

// *** ui handlers {{{

$().ready(function() // {{{
{
    ssy_init();
}); // }}}

$('#intro').on('click', function(event) // {{{
{
    // leave links working
    if(event.target.tagName != 'A')
    {
        event.preventDefault();

        $('#intro').hide();
    }
}); // }}}

$('h1').on('click', function(event) // {{{
{
    event.preventDefault();

    $('#intro').show();
}); // }}}

$('#newgame').on('click', function(event) // {{{
{
    event.preventDefault();

    ssy_start();
}); // }}}

$('#setup').on('click', function(event) // {{{
{
    event.preventDefault();

    $('#setup').toggleClass('sel');
    $('#setupwrap').toggle();
}); // }}}

$('#ui-visual').on('click', 'button', function(event) // {{{
{
    event.preventDefault();

    var what = $(this).prop('id') || false;

    if(what)
    {
        var zdo = what.split('-');
        var chng = 0;
        var cval = ssy_var.ui.visual[zdo[0]];

        switch(zdo[1])
        {
            case 'd2': chng = -0.1; break;
            case 'd1': chng = -0.01; break;
            case 'u1': chng = 0.01; break;
            case 'u2': chng = 0.1; break;
        }
        cval += chng;
        cval = +Math.max(0.1, Math.min(4, cval)).toFixed(2);
        ssy_var.ui.visual[zdo[0]] = cval;

        $('#' + zdo[0] + '-val').html(cval);

        ssy_ui_redraw(true);
        ssy_local_store('ui');
    }

}); // }}}

$('#playerpos').on('click', 'p', function(event) // {{{
{
    event.preventDefault();

    var pid = $(this).prop('id') || '';

    // remove any running animation
    $('.player').removeClass('cur');
    // must be done like this, otherwise repeated click doesn't restart animation
    setTimeout(function() { $('#p' + pid.substring(3)).addClass('cur'); }, 100);
}); // }}}

$('#movelist').on('click', function(event) // {{{
{
    event.preventDefault();

    $('#movetbl').toggleClass('small');
}); // }}}

$('#move-x, #move-2').on('click', function(event) // {{{
{
    event.preventDefault();

    $(this).toggleClass('sel');
}); // }}}

$('#go').on('click', function(event) // {{{
{
    event.preventDefault();

    ssy_move();
}); // }}}

$('#replay').on('click', 'button', function(event) // {{{
{
    event.preventDefault();

    var jump = $(this).prop('id') || '';
    var round = ssy_var.state.cur.round;
    var lastr = ssy_var.state.history.length -1;

    switch(jump.substring(4))
    {
        case 'f': round = 0; break;
        case 'p': round -= 1; break;
        case 'n': round += 1; break;
        case 'l': round = lastr; break;
    }

    // keep it within bounds
    round = Math.max(0, Math.min(lastr, round));

    ssy_replay(round);
}); // }}}

$('#map').on('click', function(event) // {{{
{
    event.preventDefault();

    $('#play').toggle();
}); // }}}

// *** ui handlers }}}
