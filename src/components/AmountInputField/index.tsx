import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import { currencyConverter } from '../../utils/currencyConverter';  // Assume path is correct
import { getPreferredCurrency } from '@babbage/sdk-ts';

const AmountInputField = () => {
  const [inputValue, setInputValue] = useState('');
  const [convertedValue, setConvertedValue] = useState('');
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    const fetchPreferredCurrency = async () => {
      const preferredCurrency = await getPreferredCurrency({});  // Adjust according to actual function signature
      setCurrency(preferredCurrency || 'USD');
    };

    fetchPreferredCurrency();
  }, []);

  useEffect(() => {
    if (inputValue) {
      const amountInUSD = currencyConverter.convert(parseFloat(inputValue), currency, 'USD');
      const amountInSats = currencyConverter.convert(amountInUSD, 'USD', 'SATS');
      console.log(amountInUSD)
      console.log(amountInSats)
      if (amountInSats) {
        setConvertedValue(amountInSats.toFixed(0));  // Assuming SATS should be integer
      }
    } else {
      setConvertedValue('');
    }
  }, [inputValue, currency]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <div>
      <TextField
        label={`Enter Amount in ${currency}`}
        variant="outlined"
        value={inputValue}
        onChange={handleInputChange}
        InputProps={{
          startAdornment: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : ''
        }}
      />
      {convertedValue && (
        <p>Equivalent in SATS: {convertedValue}</p>
      )}
    </div>
  );
};

export default AmountInputField