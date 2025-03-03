/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */

MONTHS_TO_DISPLAY = 6;

//'N/ui/serverWidget',  serverWidget, 
define(['N/search'], (search) => {
  let html = "";
  const finalResults = {};
  const orderedDates = [];

  const getSearchRange = (savedSearchId) => { //gets 1000(max) latest results.
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 1000 });
    return range;
  }

  const getCapital = (savedSearchId) => { //正味運転資本額
    const range = getSearchRange(savedSearchId); //65 items as of 20250220
    let capitalTotal = 0;

    range.reverse().forEach((result) => {
      const tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }) || 'No Date found';
      const formulaCurrencyMonth = result.getValue({ name: 'formulacurrency', summary: search.Summary.SUM }) || 0;
      capitalTotal += parseFloat(formulaCurrencyMonth) || 0;
      
      finalResults[tranDate] = { capitalTotal };
      orderedDates.push(tranDate);
    });

    orderedDates.reverse();
  };

  const getCapitalAverage = () => { //正味運転資本額 (R12)
    const AVERAGE_PERIOD = 2;

    for (let i = 0; i < MONTHS_TO_DISPLAY; i++) {
      const keys = orderedDates.slice(i, i + AVERAGE_PERIOD);
      const values = keys.map(key => finalResults[key]?.capitalTotal || 0);
      const sum = values.reduce((acc, value) => acc + value, 0);
      const capitalAverage = sum / AVERAGE_PERIOD; 

      finalResults[orderedDates[i]].capitalAverage = capitalAverage;
    }
  };

  const getInventory = (savedSearchId) => { //棚卸資産
    const range = getSearchRange(savedSearchId); //7 items as of 20250220
    let inventoryCurrencyTotal = 0;

    range.reverse().forEach((result) => {
      const tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }) || 'No Date found';
      const formulaCurrencyMonth = result.getValue({ name: 'formulacurrency', summary: search.Summary.SUM }) || 0;
      inventoryCurrencyTotal += parseFloat(formulaCurrencyMonth) || 0;

      if (finalResults[tranDate]){
        finalResults[tranDate].inventory = inventoryCurrencyTotal;
      }
    });
  };

  const getDepreciation = (savedSearchId) => { //減価償却費
    const range = getSearchRange(savedSearchId); //7 items as of 20250220

    range.forEach((result) => {
      const tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }) || 'No Date found';
      const depreciationCurrencyMonth = result.getValue({ name: 'formulacurrency', summary: search.Summary.SUM }) || 0;

      if (finalResults[tranDate]){
        finalResults[tranDate].depreciation = parseFloat(depreciationCurrencyMonth);
      }
    });
  };

  const getCostOfGoods = (savedSearchId) => { //売上原価 id is 10
    const range = getSearchRange(savedSearchId); //15 items as of 20250220

    range.forEach((result) => {
      const tranDate = result.getValue({ name: 'formulatext' }) || 'No Date found';
      const currentMonth = result.getValue({ name: 'custrecord_formatc_current_month_actual' }) || 0;

      if (finalResults[tranDate]){
        finalResults[tranDate].cog = parseInt(currentMonth) * -1; //all costs are negative, display as positive number
      }
    });
  }

  const getOperatingIncome = (savedSearchId) => { //営業利益 id is 26
    const range = getSearchRange(savedSearchId); //15 items as of 20250220

    range.forEach((result) => {
      const tranDate = result.getValue({ name: 'formulatext' }) || 'No Date found';
      const currentMonth = result.getValue({ name: 'custrecord_formatc_current_month_actual' }) || 0;

      if (finalResults[tranDate]){
        finalResults[tranDate].oi = currentMonth;
      }
    });
  }

  const getCashflow = () => { //capitalTotal + depreciation + oi 営業キャッシュフロー
    for (let i = 0; i < MONTHS_TO_DISPLAY; i++) {
      const date = orderedDates[i];
      const prevDate = orderedDates[i + 1];
      const result = finalResults[date];
      const prevResult = finalResults[prevDate];

      const capital = parseInt(result.capitalTotal) || 0;
      const prevCapital = parseInt(prevResult.capitalTotal) || 0;
      const depreciation = parseInt(result.depreciation) || 0;
      const oi = parseInt(result.oi) || 0;

      const cashFlow = capital - prevCapital + depreciation + oi;
      result.cashFlow = cashFlow;
    }
  }

  const getInvTurnover = () => { //棚卸資産回転率(原価)
    const AVERAGE_PERIOD = 12;
    
    for (let i = 0; i < MONTHS_TO_DISPLAY; i++) {
      let costOfGood = 0;
      let totalInventory = 0;
      const finalResult = finalResults[orderedDates[i]];

      for (let j = i; j < AVERAGE_PERIOD + i; j++) {
        const result = finalResults[orderedDates[j]];
        costOfGood += parseInt(result.cog) || 0;
        totalInventory += parseInt(result.inventory) || 0;
      }

      const averageInventory = totalInventory / AVERAGE_PERIOD;
      finalResult.inventoryTurnoverAverage = costOfGood / averageInventory;

      finalResult.inventoryTurnoverThisMonth = costOfGood / parseInt(finalResult.inventory);
    }
  }

  const addStyling = () => {
    html += `
      <style>
        #kpi-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        #kpi-table th, #kpi-table td {
          border: 1px solid black;
          padding: 8px;
        }
        #kpi-table th {
          background-color:rgb(242, 242, 242);
        }
      </style>`;
  }

  const render = (params) => {
    const portlet = params.portlet;

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8705
    const capitalSavedSearchId = '8705';
    getCapital(capitalSavedSearchId);
    getCapitalAverage();

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8707
    const inventorySavedSearchId = '8707';
    getInventory(inventorySavedSearchId);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8708
    const depreciationSavedSearchId = '8708';
    getDepreciation(depreciationSavedSearchId);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8718
    const goodsCostSavedSearchId = '8718';
    getCostOfGoods(goodsCostSavedSearchId);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8719
    const operatingIncomeSavedSearchId = '8719';
    getOperatingIncome(operatingIncomeSavedSearchId);

    getCashflow();

    getInvTurnover();

    addStyling();
    html += `<table id="kpi-table">`;
    html += `
      <tr>
        <th>日付</th>
        <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8705" target="_blank">正味運転資本額</a>(¥)</th>
        <th>正味運転資本額 (R12) (2 months)(¥)</th>
        <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8707" target="_blank">棚卸資産</a>(¥)</th>
        <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8708" target="_blank">減価償却費</a>(¥)</th>
        <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8718" target="_blank">売上原価</a>(¥)</th>
        <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8719" target="_blank">営業利益</a>(¥)</th>
        <th>営業キャッシュフロー(¥)</th>
        <th>売上原価(過去12ヵ月合計) / 棚卸資産(12ヵ月平均)</th>
        <th>売上原価(過去12ヵ月合計) / 棚卸資産(当月残)</th>
      </tr>`;

    for (let i = 0; i < MONTHS_TO_DISPLAY; i++) {
      const date = orderedDates[i];
      const result = finalResults[date];

      const capital = result.capitalTotal;
      const capitalAverage = result.capitalAverage;
      const inventory = result.inventory;
      const depreciation = result.depreciation;
      const cog = result.cog;
      const oi = result.oi;
      const cashFlow = result.cashFlow;
      const inventoryTurnoverAverage = result.inventoryTurnoverAverage;
      const inventoryTurnoverThisMonth = result.inventoryTurnoverThisMonth;

      html += `<tr>
        <td>${date}</td>
        <td>${capital?.toLocaleString()}</td>
        <td>${parseInt(capitalAverage)?.toLocaleString()}</td>
        <td>${inventory?.toLocaleString()}</td>
        <td>${depreciation?.toLocaleString()}</td>
        <td>${parseInt(cog)?.toLocaleString()}</td>
        <td>${parseInt(oi)?.toLocaleString()}</td>
        <td>${cashFlow?.toLocaleString()}</td>
        <td>${inventoryTurnoverAverage?.toFixed(2).toLocaleString()}</td>
        <td>${inventoryTurnoverThisMonth?.toFixed(2).toLocaleString()}</td>
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
