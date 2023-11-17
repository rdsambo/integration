import { useRef, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'
import ReactHtmlParser from 'html-react-parser';
import { DatePicker, Form, Input, Button, Space } from 'antd';
import { CaretUpOutlined, CaretDownOutlined } from  '@ant-design/icons'
import * as S from './App.styles';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import type { RadioChangeEvent } from 'antd';
import { Radio } from 'antd';
import Chart from 'chart.js/auto';

const { RangePicker } = DatePicker;

interface ParamProps {
  name: string;
  variations: string[];
  variationsID: string[];
  orientation: 'L' | 'C' | 'O' | boolean;
  // order: number;
}

const disabledDate: RangePickerProps['disabledDate'] = (current, startDate, endDate) => {
  return current 
  && (current < startDate.endOf('day')
   || current > endDate.endOf('day'));
};

function App() {
  const [tableDisplay, setTableDisplay] = useState<string>("");
  const [tableToCopy, setTableToCopy] = useState<string>("");
  const [showCopied, setShowCopied] = useState(false);
  const [copied, setCopied] = useState<number>(0);
  const [url, setUrl] = useState();
  const [variacoes, setVariacoes] = useState<ParamProps[]>([]);
  const [startDate, setStartDate] = useState();
  const [startDateBase, setStartDateBase] = useState();
  const [endDate, setEndDate] = useState();
  const [endDateBase, setEndDateBase] = useState();
  const [interval, setInterval] = useState();
  const [isApiReaded, setIsApiReaded] = useState(false);
  const [verticalLength, setVerticalLength] = useState();
  const [form] = Form.useForm();
  const selectRef = useRef();
  const [dataTemp, setDataTemp] = useState();

  const [radioValue, setRadioValue] = useState('Tabela');
  const [myChart, setMyChart] = useState();

  const makeid = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  const options = [
    { label: 'Tabela', value: 'Tabela' },
    { label: 'Linha', value: 'Linha' },
    { label: 'Barra', value: 'Barra' },
    { label: 'Pie', value: 'Pie' },
  ];

  useEffect(() => {
    if(copied != 0){
      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
      }, 5000);
    }
  }, [copied])
  const gen = useCallback(() => {
    // const url = 'https://mozambique.opendataforafrica.org/api/2.0/data?datasetId=bumjrrg&sexo=T,H,M&prov%C3%ADncia=P1&indicador=I1&idade=T&%C3%A1rea-de-resid%C3%AAncia=T,U,R';
    
    if(url) {
      axios
        .get(url)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((resp: any) => {
          if (resp.status == 200) {
              const { data } = resp;
              setDataTemp(data.data);
              let columns: string[] = [];
              const columnsNameByIndex: string[][] = [];
              const columnsIDByIndex: string[][] = [];
              let firstIterate = true;
              let verticalLength: number = 0;
              let startD: any = "";
              let endD: any = "";
              let interval: number = 12;
              data.data.forEach((item: any) => {
                if(firstIterate){
                  columns = Object.keys(item);
                  if(Array.isArray(columns)){
                    startD = new dayjs(item.startDate);
                    endD = new dayjs(item.endDate);
                    setStartDate(startD);
                    setStartDateBase(startD);
                    setEndDate(endD);
                    setEndDateBase(endD);
                    
                    let monthDiff = endD.month() - startD.month();
                    if (monthDiff < 0)
                      monthDiff = 12 - monthDiff;
                    let duration = (endD.year() - startD.year())*12 + 12 + monthDiff;
                    verticalLength = item.values.length;
                    setVerticalLength(item.values.length);
                    interval = duration/verticalLength
                    setInterval(interval);
                  }
                }
                columns.forEach((param, index) => {
                  if(Array.isArray(columnsNameByIndex[index])){
                      let notFound = false;
                      if(!columnsNameByIndex[index].find((prop) => prop == item[param].name))
                          notFound = true;
                      if(notFound) {
                        columnsNameByIndex[index] = [ ...columnsNameByIndex[index], item[param].name];
                        columnsIDByIndex[index] = [ ...columnsIDByIndex[index], item[param].id]; 
                      }
                  } else {
                      columnsNameByIndex[index] = [item[param].name];
                      columnsIDByIndex[index] = [item[param].id];
                  }
                });                
              });
  
              if(Array.isArray(columns)) {
                var tempoVs: any[] = [];
                for( let i = startD.year(); i <= endD.year(); i += interval / 12){
                  tempoVs = [...tempoVs, i];
                }
                
                let list: any = [{
                  name: 'Tempo',
                  variations: tempoVs,
                  variationsID: tempoVs,
                  orientation: 'C',
                }];
                columnsNameByIndex.forEach((nameIndex, index) => {
                  if(nameIndex.length > 1){
                    let isUndefined = false;
                    nameIndex.forEach((name) => {
                    if(typeof(name) == 'undefined')
                      isUndefined = true;
                    });
                    if(!isUndefined){
                      list = [
                        ...list,
                        {
                          name: columns[index],
                          variations: nameIndex,
                          variationsID: columnsIDByIndex[index],
                          orientation: 'O',
                        }];
                    }
                  }
                });
                let listL: any[] = [];
                let listC: any[] = [];
                let listO: any[] = [];
                list.forEach((element, i) => {
                  if(element.orientation == 'L') {
                      listL = [...listL, element]
                    }
                  if(element.orientation == 'C') {
                    listC = [...listC, element]
                  }
                  if(element.orientation == 'O') {
                    listO = [...listO, element]
                  }
                });
                setVariacoes([...listL, ...listC, ...listO]);
              }
              setIsApiReaded(true);
          }
        });
    }
  }, [url]);
  
  useEffect(() => {
    let haveColumn = false;
    let haveLine = false;
    variacoes.forEach(param => {
      if(param.orientation == 'C'){
        haveColumn = true;
      }
      if(param.orientation == 'L'){
        haveLine = true;
      }
    });

    if(isApiReaded && haveColumn && haveLine) {
      let columnsHeader = variacoes.filter((param) => param.orientation == 'C');
      let linesHeader = variacoes.filter((param) => param.orientation == 'L');
      let bodyIDs: any[] = [];
      let labelLItems: any[] = [];
      let datasetsItems: any[] = [];

      let horizontalLength = 1;
      for (let i = 0; i < columnsHeader.length; i++) {
          horizontalLength *= columnsHeader[i].variations.length;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DisplayHeaderColumnsIterativly = (() => {
        let headerLines: any[] = [columnsHeader.length];
        columnsHeader.forEach((item: any, index: number) => {
          headerLines[index] = "<tr>";
          headerLines[index] += "<th colspan=\""+(linesHeader.length)+"\"></th>";
          let quant = 1;
          for (let i = index + 1; i < columnsHeader.length; i++) {
            quant *= columnsHeader[i].variations.length;
          }
          let repeticoes = 1;
          if(index > 0)
            for (let i = 0; i < index; i++) {
              repeticoes *= columnsHeader[i].variations.length;
            }
          for (let i = 0; i < repeticoes; i++) {
            item.variations.forEach((variation: any) => {
              headerLines[index] += "<th "+(quant > 1? "colspan=\""+quant+"\"" : "")+">"+variation+"</th>";
            });
            
          }
          headerLines[index] += "</tr>";
        });
        let stringJoin = "";
        headerLines.forEach(item => {
          stringJoin += item;
        });
        return stringJoin;
      });

      const columnIndexIDs = (level, acomulado, count) => {
        let partID;
        let label;
        partID = false;
        let countL = acomulado;
        let index = 0;
        columnsHeader[level].variationsID.forEach((item) => {
          if(countL == count){
            if(level + 1 < columnsHeader.length){
              let result = columnIndexIDs(level + 1, countL, count);
              countL = result.countL;
              if(result.partID){
                partID = item + '_' + result.partID;
                label = columnsHeader[level].variations[index] + '-' + result.label;
              }
            } else {
              partID =  item;
              label = columnsHeader[level].variations[index];
              countL++;
            }
          } else {
            if(level + 1 < columnsHeader.length){
              let result = columnIndexIDs(level + 1, countL, count);
              countL = result.countL;
              if(result.partID) {
                partID = item + '_' + result.partID;
                label = columnsHeader[level].variations[index] + '-' + result.label;
              }
            } else {
              countL++;
            }  
          }
          index++;
        });
        return {label: label, partID: partID, countL:countL};
      }
      
      const GenerateBody = (() => {
        let repeticoes = 1;
        let lineV: number[] = [];
        let index = 0;
        linesHeader.forEach((element: any) => {
          lineV[index++] = 0;
          repeticoes *= element.variations.length;
        });
        let lineItems: any[] = [repeticoes];
        let dataSetLabel: any = {};
        for (let i = 0; i < repeticoes; i++) {
          let partID = "";
          let labelL = "";
          lineItems[i] = "<tr>";

          for (let x = 0; x < linesHeader.length; x++) {
            let canPrint = true;
            partID += linesHeader[x].variationsID[lineV[x]];
            labelL += linesHeader[x].variations[lineV[x]];
            if(x < linesHeader.length - 1){
              partID += '_';
              labelL += '-';
            }
            for (let j = x + 1; j < lineV.length; j++) {
              if(lineV[j] != 0)
              canPrint = false;
            }
            if(canPrint) {
              let quant = 1;
              for (let k = x + 1; k < linesHeader.length; k++) {
                quant *= linesHeader[k].variations.length;
              }
              lineItems[i] += "<th rowspan=\""+quant+"\">"+linesHeader[x].variations[lineV[x]]+"</th>";
              lineV[x] = lineV[x] + 1;
              if(lineV[x] == linesHeader[x].variations.length)
                lineV[x] = 0;
            }
          }
          
          let ids: any[] = [];
          for (let horizontalIndex = 0; horizontalIndex < horizontalLength; horizontalIndex++) {
            const result = columnIndexIDs(0, 0, horizontalIndex);
            if(i == 0) {
              labelLItems = [...labelLItems, result.label];
            }
            const cIds = result.partID + '';
            ids = [...ids, { lineIds: partID != '' ? partID.split('_') : [], columnIds: cIds.split('_') }];
            bodyIDs = [...bodyIDs, { lineIds: partID != '' ? partID.split('_') : [], columnIds: cIds.split('_') }];
            lineItems[i] += "<td id=\""+(partID + '-' + cIds)+"\"></td>";
            // datasets: [{
              // label: '# of Votes',
              // data: [12, 19, 3, 5, 2, 3],
              // : 
            // }]
          }
          dataSetLabel.label = labelL;
          dataSetLabel.borderWidth = 1;
          dataSetLabel.ids = ids;
          datasetsItems = [...datasetsItems, {...dataSetLabel}];
          
          lineItems[i] += "</tr>";
        };

        let line = "";
        lineItems.forEach(item => line += item);
        return line;
      });

      let header = DisplayHeaderColumnsIterativly();
      
      let body = GenerateBody();
      if(myChart){
          myChart.clear();
          myChart.destroy();
      }
      switch(radioValue){
        case 'Tabela':
          header = "<thead>" + header + "</thead>";
          body = "<tbody>" + body + "</tbody>";
          const table = "<table id=\"customers\">" + header + body +"</table>\n";

            const scriptStr = 
            "<script>" +
              "const xhr = new XMLHttpRequest();" +
              "const url = '" + url + "';" +
              "let yearBase = " + startDateBase.year() + ";" +
              "const bodyIDs = " + JSON.stringify(bodyIDs) + ";" +
              "const linesHeader = " + JSON.stringify(linesHeader) + ";" +
              "const columnsHeader = " + JSON.stringify(columnsHeader) + ";" +
              "xhr.open('GET', url, true);" +
              "xhr.onreadystatechange = function () {" +
                "if (this.readyState == 4 && this.status == 200) {" +
                  "const res = JSON.parse(this.responseText);" +
                  "bodyIDs.forEach(cell => {" +
                    "let filteredData = [...res.data];" +
                    "if(Array.isArray(cell.lineIds)){" +
                      "for (let i = 0; i < cell.lineIds.length; i++) {" +
                        "if (linesHeader[i].name != 'Tempo') {" +
                          "filteredData = filteredData.filter((item) => item[linesHeader[i].name].id == cell.lineIds[i]);" +
                        "} else {" +
                          "date = cell.lineIds[i];" +
                        "}" +
                      "}" +
                    "}" +
                    "if(Array.isArray(cell.columnIds)){" +
                      "for (let i = 0; i < cell.columnIds.length; i++){" +
                        "if (columnsHeader[i].name != 'Tempo') {" +
                          "filteredData = filteredData.filter((item) => item[columnsHeader[i].name].id == cell.columnIds[i]);" +
                        "} else {" +
                          "date = cell.columnIds[i];" +
                        "}" +
                      "}" +
                      
                    "}" +
                    "const value = filteredData[0].values[date - yearBase];" +
                    "const cellID = cell.lineIds.join('_') + '-' + cell.columnIds.join('_');" +
                    "const cellDOM = document.getElementById(cellID);" +
                    "cellDOM.innerHTML = value;" +
                  "})" +
                "}" +
              "};" +
              "xhr.send();" +
            "</script>";

            const styles = "<style>.shadow{box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);border-radius:5px;padding:10px;min-height:330px;}#customers{font-family: Arial, Helvetica, sans-serif;border-collapse: collapse;width: 100%;}#customers td {color: #000}#customers td, #customers th {border: 1px solid #ddd;padding: 8px;}#customers tr:nth-child(even){background-color: #f2f2f2;}#customers tr:hover {background-color: #ddd;}#customers th {padding-top: 12px;padding-bottom: 12px;text-align: left;background-color: #dc322c;color: white;}@media only screen and (max-width: 450px){#customers td, #customers th{font-size:9px;}.shadow{min-height:0px;}}.card {box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);transition: 0.3s;width: 100%;}.card:hover {box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);}</style>\n";
            setTableToCopy(table +  styles + scriptStr);
            setTableDisplay(table + styles);
            setMyChart(null);
            setTimeout(
              () => {
              let yearBase = startDateBase.year();
              bodyIDs.forEach(cell => {
                let date = 0;
                let filteredData = [...dataTemp];
                if(Array.isArray(cell.lineIds)){
                  for (let i = 0; i < cell.lineIds.length; i++) {
                    if (linesHeader[i].name != 'Tempo') {
                      filteredData = filteredData.filter((item) => item[linesHeader[i].name].id == cell.lineIds[i]);
                    } else {
                      date = cell.lineIds[i];
                    }
                  }
                }
                if(Array.isArray(cell.columnIds)){
                  for (let i = 0; i < cell.columnIds.length; i++){
                    if (columnsHeader[i].name != 'Tempo') {
                      filteredData = filteredData.filter((item) => item[columnsHeader[i].name].id == cell.columnIds[i]);
                    } else {
                      date = cell.columnIds[i];
                    }
                  }
                }
                const value = filteredData[0].values[date - yearBase];
                const cellID = cell.lineIds.join('_') + '-' + cell.columnIds.join('_');
                const cellDOM: any = document.getElementById(cellID);
                cellDOM.innerHTML = value;
              })
            }
            , 100);
          break;
        case 'Linha':
          const chartIdLine = makeid(10);
          const htmlLine = "<canvas id="+chartIdLine+"></canvas>";

          let scriptLine = '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
          setTableToCopy(htmlLine + scriptLine);
          setTableDisplay(htmlLine);
          setTimeout(
            () => {
            let yearBase = startDateBase.year();
            let datasetsCmp: any[] = datasetsItems.map(dataSet => {
              let date = 0;
              let data: any[] = [];
              dataSet.ids.map((cell: any) => {
                let filteredData = [...dataTemp];
                if(Array.isArray(cell.lineIds)){
                  for (let i = 0; i < cell.lineIds.length; i++) {
                    if (linesHeader[i].name != 'Tempo') {
                      filteredData = filteredData.filter((item) => item[linesHeader[i].name].id == cell.lineIds[i]);
                    } else {
                      date = cell.lineIds[i];
                    }
                  }
                }
                if(Array.isArray(cell.columnIds)){
                  for (let i = 0; i < cell.columnIds.length; i++){
                    if (columnsHeader[i].name != 'Tempo') {
                      filteredData = filteredData.filter((item) => item[columnsHeader[i].name].id == cell.columnIds[i]);
                    } else {
                      date = cell.columnIds[i];
                    }
                  }
                }
                const value = filteredData[0].values[date - yearBase];
                data = [...data, value];
              });
              return { label: dataSet.label,borderWidth: 1,data: data}
              
            })            

            const ctxLine = document.getElementById(chartIdLine);
            const chart = new Chart(ctxLine, {
              type: 'line',
              data: {
                labels: labelLItems,
                datasets: datasetsCmp 
                // [{
                //   label: '# of Votes',
                //   data: [12, 19, 3, 5, 2, 3],
                //   borderWidth: 1
                // }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
            setMyChart(chart);
          }, 100);
          break;
        case 'Barra':
          const chartIdBar = makeid(10);
          const htmlBar = "<canvas id="+chartIdBar+"></canvas>";

          let scriptBar = '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
          setTableToCopy(htmlBar + scriptBar);
          setTableDisplay(htmlBar);
          
          setTimeout(
            () => {
            let yearBase = startDateBase.year();
            let datasetsCmp: any[] = datasetsItems.map(dataSet => {
              let date = 0;
              let data: any[] = [];
              dataSet.ids.map((cell: any) => {
                let filteredData = [...dataTemp];
                if(Array.isArray(cell.lineIds)){
                  for (let i = 0; i < cell.lineIds.length; i++) {
                    if (linesHeader[i].name != 'Tempo') {
                      filteredData = filteredData.filter((item) => item[linesHeader[i].name].id == cell.lineIds[i]);
                    } else {
                      date = cell.lineIds[i];
                    }
                  }
                }
                if(Array.isArray(cell.columnIds)){
                  for (let i = 0; i < cell.columnIds.length; i++){
                    if (columnsHeader[i].name != 'Tempo') {
                      filteredData = filteredData.filter((item) => item[columnsHeader[i].name].id == cell.columnIds[i]);
                    } else {
                      date = cell.columnIds[i];
                    }
                  }
                }
                const value = filteredData[0].values[date - yearBase];
                data = [...data, value];
              });
              return { label: dataSet.label,borderWidth: 1,data: data}
              
            })            

            const ctx = document.getElementById(chartIdBar);
            const chartBar = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: labelLItems,
                datasets: datasetsCmp 
                // [{
                //   label: '# of Votes',
                //   data: [12, 19, 3, 5, 2, 3],
                //   borderWidth: 1
                // }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
            setMyChart(chartBar);
          }, 100);
          break;
        case 'Pie':
          const chartIdPie = makeid(10);
          const htmlPie = "<canvas id="+chartIdPie+"></canvas>";

          let scriptPie = '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
          setTableToCopy(htmlPie + scriptPie);
          setTableDisplay(htmlPie);
          //   scriptLine + = "<script>
        //   const ctx = document.getElementById('myChart');
        
        //   new Chart(ctx, {
        //     type: 'Pie',
        //     data: {
        //       labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        //       datasets: [{
        //         label: '# of Votes',
        //         data: [12, 19, 3, 5, 2, 3],
        //         borderWidth: 1
        //       }]
        //     },
        //     options: {
        //       scales: {
        //         y: {
        //           beginAtZero: true
        //         }
        //       }
        //     }
        //   });
        // </script>";
          setTimeout(
            () => {
            let yearBase = startDateBase.year();
            let datasetsCmp: any[] = datasetsItems.map(dataSet => {
              let date = 0;
              let data: any[] = [];
              dataSet.ids.map((cell: any) => {
                let filteredData = [...dataTemp];
                if(Array.isArray(cell.lineIds)){
                  for (let i = 0; i < cell.lineIds.length; i++) {
                    if (linesHeader[i].name != 'Tempo') {
                      filteredData = filteredData.filter((item) => item[linesHeader[i].name].id == cell.lineIds[i]);
                    } else {
                      date = cell.lineIds[i];
                    }
                  }
                }
                if(Array.isArray(cell.columnIds)){
                  for (let i = 0; i < cell.columnIds.length; i++){
                    if (columnsHeader[i].name != 'Tempo') {
                      filteredData = filteredData.filter((item) => item[columnsHeader[i].name].id == cell.columnIds[i]);
                    } else {
                      date = cell.columnIds[i];
                    }
                  }
                }
                const value = filteredData[0].values[date - yearBase];
                data = [...data, value];
              });
              return { label: dataSet.label,borderWidth: 1,data: data}
              
            })

            const ctx = document.getElementById(chartIdPie);
            const chartPie = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: labelLItems,
                datasets: datasetsCmp 
                // [{
                //   label: '# of Votes',
                //   data: [12, 19, 3, 5, 2, 3],
                //   borderWidth: 1
                // }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
            setMyChart(chartPie);
          }, 100);
          break;
      
      }
    }
    else setTableDisplay('');
  }, [variacoes, startDate, endDate, radioValue])

  useEffect(() => {
    if(isApiReaded)
    {
      form.setFieldValue('date', [startDate, endDate]);                    
    }
  }, [isApiReaded])
  const onFinish = () => {
    gen();
  };

  const handleOnL = (index) => {
    const variacoesLocal: ParamProps[] = [...variacoes];
    variacoesLocal[index].orientation = 'L';
    let listL: any[] = [];
    let listC: any[] = [];
    let listO: any[] = [];
    variacoesLocal.forEach((element, i) => {
      if(i != index){
        if(element.orientation == 'L') {
          listL = [...listL, element]
        }
        if(element.orientation == 'C') {
          listC = [...listC, element]
        }
        if(element.orientation == 'O') {
          listO = [...listO, element]
        }
      }
    });
    listL = [...listL, variacoesLocal[index]];

    setVariacoes([...listL, ...listC, ...listO]);
  };
  const handleOnC = (index) => {
    const variacoesLocal: ParamProps[] = [...variacoes];
    variacoesLocal[index].orientation = 'C';
    let listL: any[] = [];
    let listC: any[] = [];
    let listO: any[] = [];
    variacoesLocal.forEach((element, i) => {
      if(i != index){
        if(element.orientation == 'L') {
          listL = [...listL, element]
        }
        if(element.orientation == 'C') {
          listC = [...listC, element]
        }
        if(element.orientation == 'O') {
          listO = [...listO, element]
        }
      }
    });
    listC = [...listC, variacoesLocal[index]];

    setVariacoes([...listL, ...listC, ...listO]);
  };
  const handleOnO = (index) => {
    const variacoesLocal: ParamProps[] = [...variacoes];
    variacoesLocal[index].orientation = 'O';
    let listL: any[] = [];
    let listC: any[] = [];
    let listO: any[] = [];
    variacoesLocal.forEach((element, i) => {
      if(i != index){
        if(element.orientation == 'L') {
          listL = [...listL, element]
        }
        if(element.orientation == 'C') {
          listC = [...listC, element]
        }
        if(element.orientation == 'O') {
          listO = [...listO, element]
        }
      }
    });
    listO = [...listO, variacoesLocal[index]];

    setVariacoes([...listL, ...listC, ...listO]);
  };

  Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
  };
  const handleOnUp = (index) => {
    const variacoesLocal: ParamProps[] = [...variacoes];
    variacoesLocal.move(index, index - 1);
    setVariacoes(variacoesLocal);
  };
  const handleOnDown = (index) => {
    const variacoesLocal: ParamProps[] = [...variacoes];
    variacoesLocal.move(index, index + 1);
    setVariacoes(variacoesLocal);
  };

  const renderItem = (param: ParamProps, index) => {
    let canGoUp: boolean = param.orientation == 'O' || index == 0;
    if(!canGoUp) {
      canGoUp = param.orientation != variacoes[index - 1].orientation;
    }
    let canGoDown: boolean = param.orientation == 'O' || index == variacoes.length - 1;
    if(!canGoDown){
      canGoDown = param.orientation != variacoes[index + 1].orientation;
    }
    return (
      <div key={index}>
        <>
          <S.Item>
            <b>{param.name}</b>
            <Space direction="vertical">
              <Space wrap>
                <Button size={'small'} style={{ padding: -10 }} onClick={() => handleOnL(index)} type={ param.orientation == 'L' ? 'primary': 'default'} shape="circle">
                  L
                </Button>
                <Button size={'small'} onClick={() => handleOnC(index)} type={ param.orientation == 'C' ? 'primary': 'default'} shape="circle">
                  C
                </Button>
                <Button size={'small'} disabled={param.name == 'Tempo' ? (verticalLength == 1 ? false : true) : false } onClick={() => handleOnO(index)} type={ param.orientation == 'O' ? 'primary': 'default'} shape="circle">
                  O
                </Button>
                <Button size={'small'} disabled={canGoUp} onClick={() => handleOnUp(index)} type={'default'} shape="circle">
                <CaretUpOutlined />
                </Button>
                <Button size={'small'} disabled={canGoDown} onClick={() => handleOnDown(index)} type={'default'} shape="circle">
                  <CaretDownOutlined />
                </Button>
              </Space>
            </Space>
          </S.Item>
          {param.name == 'Tempo' &&
            <Form form={form} name='Date'>
              <Form.Item
                name={'date'}
                // initialValue={[moment(startDate.format('YYYY-MM-DDTHH:mm:ss')), moment(endDate.format('YYYY-MM-DDTHH:mm:ss'))]}
              >
                <RangePicker
                  ref={selectRef}
                  onChange={(e) => {
                    const start = dayjs(e?.[0].format('YYYY-MM-DDTHH:mm:ss'));
                    const end = dayjs(e?.[1].format('YYYY-MM-DDTHH:mm:ss'));
                    if(start && start != startDate) setStartDate(start);
                    if(end && end != endDate) setEndDate(end);

                    let duration = (end.year() - start.year())*12 + 12;
                    if(interval != 12){
                      let monthDiff = end.month() - start.month();
                      if (monthDiff < 0)
                        monthDiff = 12 - monthDiff;
                      duration += monthDiff;
                    }
                    let verticalL = duration/interval;
                    // if(verticalL > 1){
                    //   const tempoL = {...param};
                    //   tempoL.orientation = 'L';
                    //   setTempo(tempoL);
                    // }
                    setVerticalLength(verticalL);
                    var tempoVs: any[] = [];
                    // if(start.year() == end.year()) {
                    //   tempoVs = [start.year()];
                    // }
                    // else
                    for( let i = start.year(); i <= end.year(); i += interval / 12) {
                      tempoVs = [...tempoVs, i];
                    }
                    
                    const index = variacoes.findIndex((item: any) => item.name == 'Tempo');
                    let tempo = variacoes[index];
                    tempo.variations = tempoVs;
                    let variac = variacoes;
                    variac[index] = tempo;
                    setVariacoes(variac);
                    selectRef.current.blur();
                  }}
                  picker={interval == 12 ? 'year' : 'month'}
                  style={{ marginTop: 10}}
                  disabledDate={(current) => disabledDate(current, startDateBase, endDateBase)}
                />
              </Form.Item>
            </Form>
          }
        </>
      </div>
    )
  }

  const handleOnChange = ({ target: { value } }) => {
    setUrl(value);
  };
  const onChangeRadio = ({ target: { value } }) => {
    setRadioValue(value);    
  }

  return (
    <>
      <div className="container">
        <div className="settings">
          <div className='form'>
            <Form.Item label={'URL'} className="mb-3" placeholder="URL API">
              <Input
                type="primary"
                onChange={handleOnChange}
              />
            </Form.Item>
            <div className="d-grid gap-2">
              <Button type="primary" onClick={onFinish}>
                <b>Consumir API</b>
              </Button>
            </div>
          </div>
          <div className='code'>
            <h4 className='h6'>Parametros</h4>
            {isApiReaded && 
            <>
              {variacoes.map(renderItem)}
            </>
            }
          </div>
        </div>
        <div className='displayTable'>
          <div>
            <h4 className='h6'>Tipo</h4>
            <div style={{ display: 'flex', color: 'black', justifyContent: 'center', marginBottom: '10px' }}>
              <Radio.Group
                options={options}
                onChange={onChangeRadio}
                value={radioValue}
                optionType="button"
                buttonStyle="solid"
              />
            </div>
          </div>
          <h4 className='h6'>Previsualizacao</h4>
          {tableToCopy &&
            <div style={{ display: 'inline-block', position: 'absolute', top: '10px', right: 0}}>
              <span style={{ color: (showCopied ? 'black' : 'white') }}>Copiado </span>
              <CopyToClipboard text={tableToCopy}
                onCopy={() => setCopied(copied + 1)}>
                <S.Button>Copiar</S.Button>
              </CopyToClipboard>
            </div>
          }
          <br />
          <div>
            { ReactHtmlParser(tableDisplay) }
          </div>
        </div>
      </div>
    </>
  )
}

export default App
