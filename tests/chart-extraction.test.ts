import { extractCoherentSeries, parseLineForYearValue } from '../src/app/api/research/route';

// A simple assertion runner helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('=== Starting Chart Data Extraction Tests ===\n');

// Test Case 1: Line-by-line parser tests
console.log('Running parser unit tests...');
const mockItem = { url: 'https://example.com/data', title: 'Example Page' };

const pctPoints = parseLineForYearValue('| 2018 | 15.2% |', 5, mockItem);
assert(pctPoints.length === 1, 'Should extract exactly one point');
assert(pctPoints[0].year === 2018, 'Year should be 2018');
assert(pctPoints[0].value === 15.2, 'Value should be 15.2');
assert(pctPoints[0].unit === '%', 'Unit should be %');

const moneyPoints = parseLineForYearValue('Instagram revenue was $1.5 billion in 2020.', 10, mockItem);
assert(moneyPoints.length === 1, 'Should extract money point');
assert(moneyPoints[0].year === 2020, 'Year should be 2020');
assert(moneyPoints[0].value === 1500000000, 'Value should be scaled to 1.5B (1.5 * 10^9)');
assert(moneyPoints[0].unit === '$', 'Unit should be $');

const rawPoints = parseLineForYearValue('In 2024, user base reached 2,000,000,000 users.', 12, mockItem);
assert(rawPoints.length === 1, 'Should extract raw number');
assert(rawPoints[0].year === 2024, 'Year should be 2024');
assert(rawPoints[0].value === 2000000000, 'Value should be 2,000,000,000');
assert(rawPoints[0].unit === 'raw', 'Unit should be raw');
console.log('✅ Parser unit tests passed!\n');

// Test Case 2: Coherent series extraction from table
console.log('Running coherent series extraction tests...');
const mockSearchResults = [
  {
    url: 'https://businessofapps.com/instagram-stats',
    title: 'Instagram Stats & Revenue',
    description: 'Instagram revenue and user growth stats.',
    markdown: {
      code: 'SUCCESS',
      markdown: `
        # Instagram Revenue Analysis
        Here is a chronological table detailing Instagram's percentage share of Meta's total revenue:
        
        | Year | Share of Meta Revenue |
        |------|---|
        | 2015 | 7.0% |
        | 2018 | 15.0% |
        | 2020 | 25.0% |
        | 2022 | 35.0% |
        | 2024 | 40.0% |
        
        This shows substantial growth from 2015 to 2024.
      `
    }
  },
  {
    url: 'https://newsblog.com/funding-history',
    title: 'Random Industry News',
    description: 'Some random startup funding information.',
    markdown: {
      code: 'SUCCESS',
      markdown: `
        Startup funding details:
        - Meta raised $500,000 back in 2018.
        - Another company got $2B in 2021.
        - Instagram has over 2 billion users.
      `
    }
  }
];

const result = extractCoherentSeries(mockSearchResults, 'how does Instagram revenue increased this year?');
assert(result !== null, 'Should extract a valid series');
assert(result.unit === '%', 'Should select the percentage unit series');
assert(result.series.length === 5, 'Should have exactly 5 data points');
assert(result.series[0].year === 2015 && result.series[0].value === 7, 'First point should be 2015: 7%');
assert(result.series[4].year === 2024 && result.series[4].value === 40, 'Last point should be 2024: 40%');
console.log('✅ Coherent series extraction passed!\n');

// Test Case 3: Reject series with implausible jumps (e.g. outlier)
console.log('Running implausible jump validator tests...');
const mockSearchResultsWithJump = [
  {
    url: 'https://businessofapps.com/instagram-stats',
    title: 'Instagram Stats & Revenue',
    description: 'Instagram revenue and user growth stats.',
    markdown: {
      code: 'SUCCESS',
      markdown: `
        | Year | Share of Meta Revenue |
        |------|---|
        | 2015 | 7.0% |
        | 2018 | 500,000% |  <-- Implausible jump in series!
        | 2020 | 25.0% |
        | 2022 | 35.0% |
        | 2024 | 40.0% |
      `
    }
  }
];

const resultWithJump = extractCoherentSeries(mockSearchResultsWithJump, 'how does Instagram revenue increased this year?');
assert(resultWithJump === null, 'Should reject the series containing the implausible jump');
console.log('✅ Implausible jump validation passed!\n');

// Test Case 4: No clean series fallback
console.log('Running scattered garbage rejection test...');
const mockSearchResultsGarbageOnly = [
  {
    url: 'https://newsblog.com/funding-history',
    title: 'Random Industry News',
    description: 'Some random startup funding information.',
    markdown: {
      code: 'SUCCESS',
      markdown: `
        Some scattered statistics:
        - Meta raised $500,000 back in 2018.
        - The valuation was $100B in 2021.
        - They have 40% growth in some quarters.
      `
    }
  }
];

const resultGarbage = extractCoherentSeries(mockSearchResultsGarbageOnly, 'how does Instagram revenue increased this year?');
assert(resultGarbage === null, 'Should return null when there is no coherent/proximity series');
console.log('✅ Scattered garbage rejection test passed!\n');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
process.exit(0);
