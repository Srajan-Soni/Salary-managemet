// Reference data: the single source of truth for countries, currencies, FX and org structure.
// FX rates are a documented static assumption (see docs/01-requirements.md).

export const COUNTRIES = {
  US: { name: 'United States', currency: 'USD', rateToUsd: 1, costFactor: 1.0 },
  IN: { name: 'India', currency: 'INR', rateToUsd: 0.012, costFactor: 0.28 },
  GB: { name: 'United Kingdom', currency: 'GBP', rateToUsd: 1.27, costFactor: 0.85 },
  DE: { name: 'Germany', currency: 'EUR', rateToUsd: 1.08, costFactor: 0.9 },
  CA: { name: 'Canada', currency: 'CAD', rateToUsd: 0.73, costFactor: 0.88 },
  AU: { name: 'Australia', currency: 'AUD', rateToUsd: 0.65, costFactor: 0.9 },
  SG: { name: 'Singapore', currency: 'SGD', rateToUsd: 0.74, costFactor: 0.92 },
  JP: { name: 'Japan', currency: 'JPY', rateToUsd: 0.0067, costFactor: 0.8 },
  BR: { name: 'Brazil', currency: 'BRL', rateToUsd: 0.2, costFactor: 0.35 },
};

export const COUNTRY_CODES = Object.keys(COUNTRIES);

// department -> job titles with a base USD salary band (used by the seed only)
export const ORG = {
  Engineering: {
    'Software Engineer': [90_000, 150_000],
    'Senior Software Engineer': [130_000, 200_000],
    'Engineering Manager': [160_000, 230_000],
    'QA Engineer': [70_000, 120_000],
    'DevOps Engineer': [100_000, 160_000],
  },
  Product: {
    'Product Manager': [110_000, 180_000],
    Designer: [80_000, 140_000],
  },
  Sales: {
    'Sales Representative': [55_000, 110_000],
    'Account Executive': [80_000, 150_000],
    'Sales Manager': [110_000, 180_000],
  },
  Marketing: {
    'Marketing Specialist': [55_000, 100_000],
    'Marketing Manager': [100_000, 160_000],
  },
  HR: {
    'HR Specialist': [55_000, 95_000],
    Recruiter: [55_000, 100_000],
  },
  Finance: {
    Accountant: [60_000, 100_000],
    'Financial Analyst': [75_000, 125_000],
  },
  Operations: {
    'Operations Analyst': [60_000, 105_000],
    'Customer Support Representative': [38_000, 70_000],
  },
};

export const DEPARTMENTS = Object.keys(ORG);

export const currencyFor = (countryCode) => COUNTRIES[countryCode]?.currency;