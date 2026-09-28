import test from 'node:test';
import assert from 'node:assert/strict';
import {extractUsage,estimateCost,todayTotals,formatCostLine} from '../src/cost-control.js';

test('extracts provider token usage shapes',()=>{
  assert.deepEqual(extractUsage('openai',{usage:{input_tokens:10,output_tokens:4,total_tokens:14}}),{input:10,output:4,cached:0,total:14});
  assert.deepEqual(extractUsage('google',{usageMetadata:{promptTokenCount:10,candidatesTokenCount:4,totalTokenCount:14}}),{input:10,output:4,cached:0,total:14});
});
test('estimates listed model price and leaves custom models unpriced',()=>{
  assert.equal(estimateCost('gpt-6-luna',{input:1_000_000,output:0}),0.1);
  assert.equal(estimateCost('unknown',{input:100,output:100}),null);
});
test('daily totals sum saved priced requests',()=>{
  const now=new Date(2026,8,28,12,0,0);
  const same=new Date(2026,8,28,9,0,0).toISOString(),old=new Date(2026,8,27,9,0,0).toISOString();
  const t=todayTotals([{savedAt:same,estimatedCost:.1,usage:{input:10,output:5,total:15}},{savedAt:old,estimatedCost:.9,usage:{total:99}}],now);
  assert.equal(t.count,1);assert.equal(t.cost,.1);assert.equal(t.total,15);
});
test('formats a compact request cost line',()=>assert.match(formatCostLine({usage:{input:10,output:5,total:15},estimatedCost:.002}),/0\.0020 \$/));
