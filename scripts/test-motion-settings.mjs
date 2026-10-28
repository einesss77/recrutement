import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSettings,PALETTE,TEXT,customScript,contrast} from '../studio-social/assets/mockups-settings.js';
test('un réglage invalide conserve les couleurs du modèle',()=>{const s=normalizeSettings({colors:{bg:'url(https://example.com)',mint:'#aabbcc'},text:{hook1:'a'.repeat(300),brand:7}});assert.equal(s.colors.bg,PALETTE.bg);assert.equal(s.colors.mint,'#aabbcc');assert.equal(s.text.hook1.length,42);assert.equal(s.text.brand,TEXT.brand);});
test('les palettes de deux vidéos restent indépendantes',()=>{const a=normalizeSettings(),b=normalizeSettings();a.colors.bg='#123456';a.text.brand='Client';assert.equal(b.colors.bg,PALETTE.bg);assert.equal(b.text.brand,TEXT.brand);});
test('la voix de démo est incompatible avec un script modifié',()=>{const s=normalizeSettings();assert.equal(customScript(s),false);s.colors.bg='#123456';assert.equal(customScript(s),false);s.text.request='Une autre demande';assert.equal(customScript(s),true);});
test('le contraste distingue une palette lisible et du blanc sur blanc',()=>{assert.equal(contrast('#ffffff','#ffffff'),1);assert.equal(contrast('#000000','#ffffff'),21);assert.ok(contrast(PALETTE.bg,PALETTE.paper)>4.5);});
