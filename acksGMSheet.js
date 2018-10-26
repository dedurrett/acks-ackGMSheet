'use strict';

/* global on log playerIsGM findObjs getObj getAttrByName sendChat globalconfig */ // eslint-disable-line no-unused-vars

/*
Modified GMSheet- Base Version 0.2.0
A modified GM Cheatsheet for my custom ACKS Sheet on roll20.net.
*/

on('ready', function () {
  var v = '0.2.0'; // version number
  var scname = 'GMSheet'; // script name
  log(scname + ' v' + v + ' online. Select one or more party members, then use `!gmsheet -h`');
  var output = '';
  var collectedAttributes = '';
  var wantedAttributes = void 0;
  var columnjumper = 0;
  var myoutput = '';
  var resourceName = '';
  var otherresourceName = '';

  var resolveAttr = function resolveAttr(cid, attname) {
    var attobj = findObjs({
      type: 'attribute',
      characterid: cid,
      name: attname
    }, { caseInsensitive: true })[0];
    if (!attobj) {
      return { name: '', current: '', max: '' };
    }
    var att2 = { name: attobj.get('name'), current: attobj.get('current'), max: attobj.get('max') };
    return att2;
  };

  var getCharMainAtt = function getCharMainAtt(cid2) {
    //! Main attributes
    output = '<table border=0><tr>';
    var cid = cid2.id;
    wantedAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    wantedAttributes.forEach(function (myAtt) {
      collectedAttributes = resolveAttr(cid, myAtt);
      output += '<td><strong>' + collectedAttributes.name.slice(0, 3).toUpperCase() + ':</strong></td><td> ' + (resolveAttr(cid, myAtt + 'Mod').current > 0 ? '+' + resolveAttr(cid, myAtt + 'Mod').current : resolveAttr(cid, myAtt + 'Mod').current) + '</td><td> <small>(' + collectedAttributes.current + ')</small></td><td>  </td>';
      if (columnjumper === 1) {
        output += '</tr><tr>';
        columnjumper = 0;
      } else {
        columnjumper = 1;
      }
    });
    output += '</tr></table>';
    return output;
  };

  var getCharOtherAtt = function getCharOtherAtt(cid2) {
    //! Other Attributes
    output = '';
    var cid = cid2.id;
    var hp = parseInt(resolveAttr(cid, 'hitpoints').current, 10);
    var maxhp = parseInt(resolveAttr(cid, 'hitpoints').max, 10);
    var hpdown = maxhp - hp;
    var hppercentage = Math.floor(100 * hp / maxhp / 5) * 5;
    var armorclass = parseInt(resolveAttr(cid, 'armor').current) + parseInt(resolveAttr(cid, 'armorMisc').current) + parseInt(resolveAttr(cid, 'dexterityMod').current);
    var initiative = parseInt(resolveAttr(cid, 'initiativeMisc').current) + parseInt(resolveAttr(cid, 'dexterityMod').current);
    output = '<br><small><i><strong>' + resolveAttr(cid, 'alignment').current + '</strong> Lvl ' +resolveAttr(cid, 'level').current + ' ' + resolveAttr(cid, 'race').current + ' ' + resolveAttr(cid, 'class').current + '</i></small>';
    output += '<br><br><strong>HP:</strong> ' + hp + '/' + maxhp + ' ';
    output += hp < maxhp ? ' <small style=\'color:#9d0a0e\' title=\'down by ' + hpdown + ' points, (' + hppercentage + '%) \'> ' + hppercentage + '% (-' + hpdown + ' HP)</small> ' : '';
    output += '<br><strong>AC:</strong> ' + armorclass;
    output += '<br><br>Combat Speed: ' + resolveAttr(cid, 'moveCombat').current + ' ft';
    output += '<br>Initiative bonus: ' + (initiative > 0 ? '+' + initiative : initiative);
    output += '<br><br>';
    return output;
  };

  var getSpellSlots = function getSpellSlots(cid2) {
    //! Spell slots
    output = '';
    var cid = cid2.id;

    output = '<br><b>Spell slots</b><br>';
    var i = 1;
    var spellLevelTotal = 0;
    var spellLevelRm = 0;
    var spellcount = 0;
    while (i < 10) {
      spellLevelTotal = resolveAttr(cid, 'spells_l' + parseInt(i, 10)).max;
      if (spellLevelTotal === 0 || spellLevelTotal === '') break;
      spellLevelRm = spellLevelTotal-resolveAttr(cid, 'spells_l' + parseInt(i, 10)).current;
      if (spellLevelTotal > 0) {
        spellcount += 1;
        if (spellLevelRm / spellLevelTotal <= 0.25) spellLevelRm = '<span style=\'color:red\'>' + spellLevelRm + '</span>';else if (spellLevelRm / spellLevelTotal <= 0.5) spellLevelRm = '<span style=\'color:orange\'>' + spellLevelRm + '</span>';else if (spellLevelRm / spellLevelTotal <= 0.75) spellLevelRm = '<span style=\'color:green\'>' + spellLevelRm + '</span>';else spellLevelRm = '<span style=\'color:blue\'>' + spellLevelRm + '</span>';
        output += '<b>Level ' + i + ':</b> ' + spellLevelRm + ' / ' + spellLevelTotal + '<br>';
      }
      i += 1;
    }
    if (spellcount < 1) output = '';

    //! class resources
    /*
    resourceName = resolveAttr(cid, 'class_resource_name').current;
    otherresourceName = resolveAttr(cid, 'other_resource_name').current;

    var classResourceTotal = resolveAttr(cid, 'class_resource').max;
    var classResourceCurrent = resolveAttr(cid, 'class_resource').current;
    var otherResourceTotal = resolveAttr(cid, 'other_resource').max;
    var otherResourceCurrent = resolveAttr(cid, 'other_resource').current;

    if (resourceName && classResourceTotal > 0) output += '<br>' + resourceName + ': ' + classResourceCurrent + '/' + classResourceTotal;
    if (otherresourceName && otherResourceTotal > 0) output += '<br>' + otherresourceName + ': ' + otherResourceCurrent + '/' + otherResourceTotal;
    resourceName = '';
    */
    return output;
  };

  on('chat:message', function (msg) {
    if (msg.type !== 'api' && !playerIsGM(msg.playerid)) return;
    if (msg.content.startsWith('!gmsheet') !== true) return;
    if (msg.selected == null) {
      sendChat(scname, '/w gm **ERROR:** You need to select at least one character.');
      /* will add a routine to save/load characters later */
    } else {
      msg.selected.forEach(function (obj) {
        //! Output
        var token = getObj('graphic', obj._id); // eslint-disable-line no-underscore-dangle
        var character = void 0;
        if (token) {
          character = getObj('character', token.get('represents'));
        }
        if (character) {
          /* get the attributes and assemble the output */
          var charname = character.get('name');
          var charicon = character.get('avatar');
          if (myoutput.length > 0) myoutput += '<br>';
          myoutput += '<div style=\'display:inline-block; font-variant: small-caps; color:##9d0a0e; font-size:1.8em;margin-top:5px;\'><img src=\'' + charicon + '\' style=\'height:48px;width:auto;margin-right:5px;margin-bottom:0px;margin-top:5px; vertical-align:middle\'>' + charname + '</div>' + getCharOtherAtt(character) + getCharMainAtt(character) + getSpellSlots(character);
        }
      });
      sendChat(scname, '/w gm <div style=\'border:1px solid black; background-color: #f9f7ec; padding:8px; border-radius: 6px; font-size:0.85em;line-height:0.95em;\'>' + myoutput + '</div>'); // eslint-disable-line quotes
      myoutput = '';
    }
  });
});
