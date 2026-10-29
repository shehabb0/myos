import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,prop,dateValid,server} from '../server.js';
test('date validation accepts ISO day and rejects unsafe inputs',()=>{
 assert.equal(dateValid('2026-10-29'),true);
 assert.equal(dateValid('2026/10/29'),false);
 assert.equal(dateValid('abc'),false);
});
test('normalizer reads Notion title, number, date and checkbox',()=>{
 const result=normalize({id:'123',url:'https://notion.so/x',properties:{Name:{type:'title',title:[{plain_text:'Test'}]},Date:{type:'date',date:{start:'2026-10-29'}},Amount:{type:'number',number:120},Taken:{type:'checkbox',checkbox:true}}});
 assert.equal(result.Name,'Test');assert.equal(result.Date,'2026-10-29');assert.equal(result.Amount,120);assert.equal(result.Taken,true);
});
test('property encoder formats updates correctly',()=>{
 assert.deepEqual(prop('number',3000),{number:3000});
 assert.deepEqual(prop('checkbox',true),{checkbox:true});
 assert.deepEqual(prop('date','2026-10-29'),{date:{start:'2026-10-29'}});
});
server.close();