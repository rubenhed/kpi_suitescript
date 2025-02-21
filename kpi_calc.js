/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */

MONTHS_TO_DISPLAY = 2;

define(['N/ui/serverWidget', 'N/search'], (serverWidget, search) => {
  let html = "";
  
  const getCapital = (savedSearchId) => { //正味運転資本額
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 200 }); //65 items as of 20250220

    const results = [];
    let formulaCurrencyTotal = 0;

    range.reverse().forEach((result) => {
      const tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }) || 'No Date found';

      const formulaCurrencyMonth = result.getValue({ name: 'formulacurrency', summary: search.Summary.SUM }) || 0;

      formulaCurrencyTotal += parseFloat(formulaCurrencyMonth) || 0;

      results.push({ tranDate, formulaCurrencyTotal });
    });
    
    return results.reverse();
  };

  const getAverage = (capitalResults) => {
    const capitalCurrency = capitalResults.map(capitalResults => capitalResults.formulaCurrencyTotal);
    const AVERAGE_PERIOD = 2;
    const averageResults = [];
    for (let i = 0; i < MONTHS_TO_DISPLAY; i++) {
      const average = capitalCurrency.slice(i, i + AVERAGE_PERIOD).reduce((acc, value) => acc + value, 0) / AVERAGE_PERIOD;
      averageResults.push(average);
    }

    return averageResults;
  };

  const getInventory = (savedSearchId) => { //棚卸資産
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 200 }); //7 items as of 20250220

    const results = [];
    let formulaCurrencyTotal = 0;

    range.reverse().forEach((result) => {
      const tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }) || 'No Date found';

      const formulaCurrencyMonth = result.getValue({ name: 'formulacurrency', summary: search.Summary.SUM }) || 0;

      formulaCurrencyTotal += parseFloat(formulaCurrencyMonth) || 0;

      results.push({ tranDate, formulaCurrencyTotal });
    });
    
    return results.reverse();
  };

  const getDepreciation = (savedSearchId) => { //減価償却費
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 200 }); //7 items as of 20250220

    const results = [];

    range.forEach((result) => {
      const tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }) || 'No Date found';

      const formulaCurrencyMonth = result.getValue({ name: 'formulacurrency', summary: search.Summary.SUM }) || 0;

      results.push({ tranDate, formulaCurrencyMonth : parseFloat(formulaCurrencyMonth) });
    });

    return results;
  };

  const getCostOfGoods = (savedSearchId, dates) => { //売上原価and営業利益 id is 10 and 26
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 200 }); //15 items as of 20250220
    const months = dates.map(date => parseInt(date.split("-")[1], 10));

    const results = [];
    let c = -1;
    let found = false

    range.forEach((result) => {
      c++;
      const recordMonth = result.getValue({ name: 'custrecord_formatc_month' });
      if (!found && recordMonth != months[c]) {
        return;
      }
      found = true;
      
      
      while (recordMonth != months[c]) {
        results.push({ currentMonth: 0 });
        c++;
      }

      const currentMonth = result.getValue({ name: 'custrecord_formatc_current_month_actual' }) || 0;

      results.push({ currentMonth });
    });

    return results;
  }

  const render = (params) => {
    const portlet = params.portlet;

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8705
    const capitalSavedSearchId = '8705';
    const capitalResults = getCapital(capitalSavedSearchId);

    const averageResults = getAverage(capitalResults);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8707
    const inventorySavedSearchId = '8707';
    const inventoryResults = getInventory(inventorySavedSearchId);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8708
    const depreciationSavedSearchId = '8708';
    const depreciationResults = getDepreciation(depreciationSavedSearchId);

    dates = capitalResults.map(capitalResults => capitalResults.tranDate);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8718
    const goodsCostSavedSearchId = '8718';
    const cogResults = getCostOfGoods(goodsCostSavedSearchId, dates);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8719
    const operatingIncomeSavedSearchId = '8719';
    const oiResults = getCostOfGoods(operatingIncomeSavedSearchId, dates);


    // Create the HTML content with styling
    html += `
      <style>
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid black;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>`;

    html += `<table>`;
    html += `<tr>
      <th>日付</th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8705" target="_blank">正味運転資本額</a></th>
      <th>正味運転資本額 (R12) (2 months)</th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8707" target="_blank">棚卸資産</a></th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8708" target="_blank">減価償却費</a></th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8718" target="_blank">売上原価</a></th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8718" target="_blank">営業利益</a></th>
    </tr>`;

    for (let i = 0; i < MONTHS_TO_DISPLAY; i++) {
      const capital = capitalResults[i];
      const average = averageResults[i];
      const inventory = inventoryResults[i];
      const depreciation = depreciationResults[i];
      const cog = cogResults[i];
      const oi = oiResults[i];

      html += `<tr>
        <td>${capital.tranDate}</td>
        <td>${capital.formulaCurrencyTotal.toLocaleString()}¥</td>
        <td>${parseInt(average).toLocaleString()}¥</td>
        <td>${inventory.formulaCurrencyTotal.toLocaleString()}¥</td>
        <td>${depreciation.formulaCurrencyMonth.toLocaleString()}¥</td>
        <td>${parseInt(cog.currentMonth).toLocaleString()}¥</td>
        <td>${parseInt(oi.currentMonth).toLocaleString()}¥</td>
      </tr>`;
    }

    html += '</table>';

    portlet.title = 'KPI numbers';
    portlet.html = html;
  };

  return {
    render: render,
  };
});
