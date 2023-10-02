import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'
import ReactHtmlParser from 'html-react-parser';
import { DatePicker, Form, Input, Button, Space } from 'antd';
import * as S from './App.styles';
import dayjs from 'dayjs';
import moment from 'moment';
import type { RangePickerProps } from 'antd/es/date-picker';
import {CopyToClipboard} from 'react-copy-to-clipboard';

const { RangePicker } = DatePicker;

interface RelevantColumnsProps {
  column: number;
  subColumn: RelevantColumnsProps | undefined;
}
interface ParamProps {
  name: string;
  variations: string[];
  variationsID: string[];
  orientation: 'L' | 'C' | 'O' | boolean;
  order: number;
}
interface TempoProps {
  orientation: 'L' | 'C' | 'O' | boolean;
  max: number;
  min: number;
}

const disabledDate: RangePickerProps['disabledDate'] = (current, startDate, endDate) => {
  return current 
  && (current < startDate.endOf('day')
   || current > endDate.endOf('day'));
};

function App() {
  // const [count, setCount] = useState(0)
  const [tableDisplay, setTableDisplay] = useState<string>("");
  const [tableToCopy, setTableToCopy] = useState<string>("");
  const [showCopied, setShowCopied] = useState(false);
  const [copied, setCopied] = useState<number>(0);
  const [url, setUrl] = useState();
  const [variacoes, setVariacoes] = useState<ParamProps[]>([]);
  const [tempo, setTempo] = useState<TempoProps>({orientation: 'L', max: 0, min: 0});
  const [startDate, setStartDate] = useState();
  const [startDateBase, setStartDateBase] = useState();
  const [endDate, setEndDate] = useState();
  const [endDateBase, setEndDateBase] = useState();
  const [interval, setInterval] = useState();
  const [isApiReaded, setIsApiReaded] = useState(false);
  const [horizontalLength, setHorizontalLength] = useState();
  const [verticalLength, setVerticalLength] = useState();
  const [form] = Form.useForm();
  
  const [dataTemp, setDataTemp] = useState();

  useEffect(() => {
    if(copied != 0){
      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
      }, "5000");
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
              let countLevels: number = 0;
              let verticalLength: number = 0;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.data.forEach((item: any) => {
                if(firstIterate){
                  columns = Object.keys(item);
                  if(Array.isArray(columns)){
                    let startD = new dayjs(item.startDate);
                    let endD = new dayjs(item.endDate);
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
                    setInterval(duration/verticalLength);
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
                let list: any = [];
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
                          orientation: false,
                          order: countLevels++
                        }];
                    }
                  }
                });
                setVariacoes(list);
              }
              setIsApiReaded(true);
          }
        });
    }
  }, [url]);
  
  useEffect(() => {
    let orientationDone = true;
    let haveColumn = false;
    let haveLine = false;
    variacoes.forEach(param => {
      if(!param.orientation){
        orientationDone = false;
      }
      if(param.orientation == 'C'){
        haveColumn = true;
      }
      if(param.orientation == 'L'){
        haveLine = true;
      }
    });
    if(tempo.orientation == 'C'){
      haveColumn = true;
    }
    if(tempo.orientation == 'L'){
      haveLine = true;
    }
    if(isApiReaded && orientationDone && haveColumn && haveLine) {
      let columnsHeader = variacoes.filter((param) => param.orientation == 'C');
      columnsHeader = columnsHeader.sort((a, b) => a.order - b.order);
      let linesHeader = variacoes.filter((param) => param.orientation == 'L');
      linesHeader = linesHeader.sort((a, b) => a.order - b.order);
      let bodyIDs: any[] = [];
      // { date: , lineIds: , columnIds:  } 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // const CountRamification = (relevantColumns: RelevantColumnsProps, data: any[]): number => {
      //     let quant = 0;
      //     columnsNameByIndex[relevantColumns.column].map((variation) => {
      //         const filteredData = data
      //             .filter((item) =>item[columns[relevantColumns.column]].name == variation);
      //         if(typeof(relevantColumns.subColumn) == 'undefined') {
      //             quant++;
      //         } else {
      //             quant += CountRamification(relevantColumns.subColumn, filteredData) - 1;
      //         }
      //     });
      //     return quant;
      // }
      // let isOnlyOne = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DisplayHeaderColumnsIterativly = ((index) => {
        let subTheaders = "";
        let superTheaders = "";
        if(index == 0) {
            superTheaders = "<tr>";
            superTheaders += tempo.orientation == 'L' ? "<th rowspan=\""+columnsHeader.length+"\">Date</th>" : '';
            if(letHeaderLength >= 1)
              superTheaders += "<th colspan=\""+(letHeaderLength - 2)+"\"></th>";
            subTheaders = "<tr>";
        }
        let param = columnsHeader[index];
        param.variations.forEach(variation => {
          if(index == columnsHeader.length - 1) {
            superTheaders += "<th>"+variation+"</th>";
          } else {
            let quant = 0;
            for (let i = index + 1; i < columnsHeader.length; i++) {
              if(i == index + 1)
                quant += columnsHeader[i].variations.length;
              else
                quant += columnsHeader[i].variations.length - 1;
            }
            superTheaders += "<th "+(quant > 1? "colspan=\""+quant+"\"" : "")+">"+variation+"</th>";
            subTheaders += DisplayHeaderColumnsIterativly(index + 1);
          }
        });
        
        if(index == 0) {
            superTheaders += "</tr>";
            subTheaders += "</tr>";
        }
        return superTheaders += subTheaders;
      });
  
      let horizontalLength = 1;
      for (let i = 0; i < variacoes.length; i++) {
        if(variacoes[i].orientation == 'C')
          horizontalLength *= variacoes[i].variations.length;
      }
      let letHeaderLength = 1;
      let haveLineParam = false;
      for (let i = 0; i < variacoes.length; i++) {
        if(variacoes[i].orientation == 'L'){
          letHeaderLength *= variacoes[i].variations.length;
          haveLineParam = true;
        }
      }
      if(!haveLineParam){
        letHeaderLength = 0;
      }
      setHorizontalLength(horizontalLength);

      const columnIndexIDs = (level, acomulado, count) => {
        let partID;
        partID = false;
        let countL = acomulado;
        columnsHeader[level].variationsID.forEach((item) => {
          if(countL == count){
            if(level + 1 < columnsHeader.length){
              let result = columnIndexIDs(level + 1, countL, count);
              countL = result.countL;
              if(result.partID) {
                partID = item + '_' + result.partID;
              }
            } else {
              partID =  item;
              countL++;
            }
          } else {
            if(level + 1 < columnsHeader.length){
              let result = columnIndexIDs(level + 1, countL, count);
              countL = result.countL;
              if(result.partID) {
                partID = item + '_' + result.partID;
              }
            } else {
              countL++;
            }  
          }
        });
        return {partID: partID, countL:countL};
      }
      const GenerateBody = (() => {
        let line = "";
        let date = startDate.year();
        if (tempo.orientation == 'L') {
          for (let verticalIndex = 0; verticalIndex < verticalLength; verticalIndex++) {
            let columnsTracker = [];
            let dt = date++;
            for (let x = 0; x < (letHeaderLength == 0 ? 1 : letHeaderLength); x++) {
              let partID = "";
                if(x == 0){
                  line += "<tr>";
                  line += "<th " + (letHeaderLength > 1 ? ('rowspan="'+letHeaderLength+'"') : '' ) + ">"+(dt)+"</th>";
                  for (let j = 0; j < linesHeader.length; j++) {
                    const param = linesHeader[j];
                    partID += (j == 0 ? '' : '_') + param.variationsID[0];
                    columnsTracker[j] = 0;
                    line += "<th " + (linesHeader.length - j > 1 ? ('rowspan="'+(linesHeader.length - j)+'"') : '' ) + ">"+param.variations[0]+"</th>";
                  }
                  for (let horizontalIndex = 0; horizontalIndex < horizontalLength; horizontalIndex++) {
                    const cIds = columnIndexIDs(0, 0, horizontalIndex).partID + '';
                    bodyIDs = [...bodyIDs, { date: dt, lineIds: partID != '' ? partID.split('_') : [], columnIds: cIds.split('_') }];
                    line += "<td id=\""+(dt + (partID != '' ? '-' + partID : '') + '-' + cIds)+"\">" + 
                    "</td>";
                  }
                  line += "</tr>";
                } else {
                  line += "<tr>";
                  let jumpOnNext = false;
                  for (let j = linesHeader.length - 1; j >= 0; j--) {
                    if(columnsTracker[j] == linesHeader[j].variations.length){
                      columnsTracker[j] = 0;
                      jumpOnNext = true; 
                    } else {
                      if(j == linesHeader.length - 1) {
                        columnsTracker[j] += 1;
                      } else
                      if(jumpOnNext) {
                        columnsTracker[j] += 1;
                      }
                      jumpOnNext = false;
                    }
                  }
                  for (let j = 0; j < linesHeader.length; j++) {
                    const param = linesHeader[j];
                    let variation = param.variations[columnsTracker[j]];
                    partID += (j == 0 ? '' : '_') + param.variationsID[columnsTracker[j]];
                    line += "<th " + (linesHeader.length - j > 1 ? ('rowspan="'+(linesHeader.length - j)+'"') : '') + ">"+variation+"</th>";
                  }
                  for (let horizontalIndex = 0; horizontalIndex < horizontalLength; horizontalIndex++) {
                    const cIds = columnIndexIDs(0, 0, horizontalIndex).partID + '';
                    bodyIDs = [...bodyIDs, { date: dt, lineIds: partID != '' ? partID.split('_') : [], columnIds: cIds.split('_') }];
                    line += "<td id=\""+(dt  + (partID != '' ? '-' + partID : '') + '-' + cIds)+"\">" + "</td>";
                  }
                  line += "</tr>";
                }
            }
          }
        } else if (tempo.orientation == 'O') {
            let columnsTracker = [];
            for (let x = 0; x < letHeaderLength; x++) {
              let partID = "";
              const dt = startDate.year();
              if(letHeaderLength > 0){
                if(x == 0){
                  line += "<tr>";
                  // line += "<th " + (letHeaderLength > 1 ? ('rowspan="'+letHeaderLength+'"') : '' ) + ">"+(date++)+"</th>";
                  for (let j = 0; j < linesHeader.length; j++) {
                    const param = linesHeader[j];
                    columnsTracker[j] = 0;
                    partID += (j == 0 ? '' : '_') + param.variationsID[0];
                    line += "<th " + (linesHeader.length - j > 1 ? ('rowspan="'+(linesHeader.length - j)+'"') : '' ) + ">"+param.variations[0]+"</th>";
                  }
                  for (let horizontalIndex = 0; horizontalIndex < horizontalLength; horizontalIndex++) {
                    const cIds = columnIndexIDs(0, 0, horizontalIndex).partID + '';
                    bodyIDs = [...bodyIDs, { date: dt, lineIds: partID != '' ? partID.split('_') : [], columnIds: cIds.split('_') }];
                    line += "<td id=\""+(dt + (partID != '' ? '-' + partID : '') + '-' + cIds)+"\">" + 
                    "</td>";
                  }
                  line += "</tr>";
                } else {
                  line += "<tr>";
                  let jumpOnNext = false;
                  for (let j = linesHeader.length - 1; j >= 0; j--) {
                    if(columnsTracker[j] == linesHeader[j].variations.length){
                      columnsTracker[j] = 0;
                      jumpOnNext = true; 
                    } else {
                      if(j == linesHeader.length - 1) {
                        columnsTracker[j] += 1;
                      } else
                      if(jumpOnNext) {
                        columnsTracker[j] += 1;
                      }
                      jumpOnNext = false;
                    }
                  }
                  for (let j = 0; j < linesHeader.length; j++) {
                    const param = linesHeader[j];
                    let variation = param.variations[columnsTracker[j]];
                    partID += (j == 0 ? '' : '_') + param.variationsID[columnsTracker[j]];
                    line += "<th " + (linesHeader.length - j > 1 ? ('rowspan="'+(linesHeader.length - j)+'"') : '') + ">"+variation+"</th>";
                  }
                  for (let horizontalIndex = 0; horizontalIndex < horizontalLength; horizontalIndex++) {
                    const cIds = columnIndexIDs(0, 0, horizontalIndex).partID + '';
                    bodyIDs = [...bodyIDs, { date: dt, lineIds: partID != '' ? partID.split('_') : [], columnIds: cIds.split('_') }];
                    line += "<td id=\""+(dt + (partID != '' ? '-' + partID : '') + '-' + cIds)+"\">" + "</td>";
                  }
                  line += "</tr>";
                }
              } else {
                line += "<th>"+(date++)+"</th>";
                for (let horizontalIndex = 0; horizontalIndex < horizontalLength; horizontalIndex++) {
                  const cIds = columnIndexIDs(0, 0, horizontalIndex).partID + '';
                  bodyIDs = [...bodyIDs, { date: dt, lineIds: partID != '' ? partID.split('_') : [], columnIds: cIds.split('_') }];
                  line += "<td id=\""+(dt + (partID != '' ? '-' + partID : '') + '-' + cIds)+"\">" + 
                  "</td>";
                }
                line += "</tr>";
              }
            }
        }
        return line;
      });

      let header = DisplayHeaderColumnsIterativly(0);
      header = "<thead>" + header + "</thead>";
      
      let body = GenerateBody();
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
                    "filteredData = filteredData.filter((item) => item[linesHeader[i].name].id == cell.lineIds[i]);" +
                  "}" +
                "}" +
                "if(Array.isArray(cell.columnIds)){" +
                  "for (let i = 0; i < cell.columnIds.length; i++){" +
                    "filteredData = filteredData.filter((item) => item[columnsHeader[i].name].id == cell.columnIds[i]);" +
                  "}" +
                "}" +
                "const value = filteredData[0].values[cell.date - yearBase];" +
                "const cellID = cell.date + '-' + (cell.lineIds.length > 0 ? cell.lineIds.join('_') + '-' : '') + (cell.columnIds.length > 0 ? cell.columnIds.join('_') : '');" +
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
        setTimeout(() => {
          let yearBase = startDateBase.year();
          bodyIDs.forEach(cell => {
            let filteredData = [...dataTemp];
            if(Array.isArray(cell.lineIds)){
              for (let i = 0; i < cell.lineIds.length; i++) {
                filteredData = filteredData.filter((item) => item[linesHeader[i].name].id == cell.lineIds[i]);
              }
            }
            if(Array.isArray(cell.columnIds)){
              for (let i = 0; i < cell.columnIds.length; i++){
                filteredData = filteredData.filter((item) => item[columnsHeader[i].name].id == cell.columnIds[i]);
              }
            }
            const value = filteredData[0].values[cell.date - yearBase];
            const cellID = cell.date + '-' + (cell.lineIds.length > 0 ? cell.lineIds.join('_') + '-' : '') + (cell.columnIds.length > 0 ? cell.columnIds.join('_') : '');
            const cellDOM = document.getElementById(cellID);
            cellDOM.innerHTML = value;
          })
        }, "100");
    }
    else setTableDisplay('');
  }, [variacoes, tempo, startDate, endDate])

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
    setVariacoes([...variacoesLocal]);
  };
  const handleOnC = (index) => {
    const variacoesLocal: ParamProps[] = [...variacoes];
    variacoesLocal[index].orientation = 'C';
    setVariacoes([...variacoesLocal]);
  };
  const handleOnO = (index) => {
    const variacoesLocal: ParamProps[] = [...variacoes];
    variacoesLocal[index].orientation = 'O';
    setVariacoes([...variacoesLocal]);
  };
  const handleTempoOnL = () => {
    const { max, min } = tempo;
    setTempo({ orientation: 'L', max: max, min: min });
  };
  const handleTempoOnC = () => {
    const { max, min } = tempo;
    setTempo({ orientation: 'C', max: max, min: min });
  };
  const handleTempoOnO = () => {
    const { max, min } = tempo;
    setTempo({ orientation: 'O', max: max, min: min });
  };

  const renderItem = (param: ParamProps, index) => {
    return (
      <S.Item key={index}>
        <b>{param.name}</b>
        <Space direction="vertical">
          <Space wrap>
            <Button onClick={() => handleOnL(index)} type={ param.orientation == 'L' ? 'primary': 'default'} shape="circle">
              L
            </Button>
            <Button onClick={() => handleOnC(index)} type={ param.orientation == 'C' ? 'primary': 'default'} shape="circle">
              C
            </Button>
            <Button onClick={() => handleOnO(index)} type={ param.orientation == 'O' ? 'primary': 'default'} shape="circle">
              O
            </Button>
          </Space>
        </Space>
      </S.Item>
    )
  }

  const handleOnChange = (e) => {
    setUrl(e.target.value);
  };

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
              <S.Item>
                <b>Tempo</b>
                <Space direction="vertical">
                  <Space wrap>
                    <Button onClick={() => handleTempoOnL()} type={ tempo.orientation == 'L' ? 'primary': 'default'} shape="circle">
                      L
                    </Button>
                    <Button onClick={() => handleTempoOnC()} type={ tempo.orientation == 'C' ? 'primary': 'default'} shape="circle">
                      C
                    </Button>
                    <Button disabled={verticalLength == 1 ? false : true } onClick={() => handleTempoOnO()} type={ tempo.orientation == 'O' ? 'primary': 'default'} shape="circle">
                      O
                    </Button>
                  </Space>
                </Space>
              </S.Item>
              <Form form={form} name='Date'>
                <Form.Item
                  name={'date'}
                  // initialValue={[moment(startDate.format('YYYY-MM-DDTHH:mm:ss')), moment(endDate.format('YYYY-MM-DDTHH:mm:ss'))]}
                >
                  <RangePicker
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
                      if(verticalL > 1){
                        const tempoL = {...tempo.orientation};
                        tempoL.orientation = 'L';
                        setTempo(tempoL);
                      }
                      setVerticalLength(verticalL);
                    }}
                    picker={interval == 12 ? 'year' : 'month'}
                    style={{ marginTop: 10}}
                    disabledDate={(current) => disabledDate(current, startDateBase, endDateBase)}
                  />
                </Form.Item>
              </Form>
            </>}
          </div>
        </div>
        <div className='displayTable'>
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
