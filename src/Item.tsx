import React from 'react'
import { ParamProps } from './App';
import * as S from './App.styles'
import { Form, Input, Button, Space } from 'antd';

interface ItemProps {
  param: ParamProps;
  variacoes: ParamProps[];
  setVariacoes: (param: any) => void;
}
export const Item: React.FC<ItemProps> = ({ param, index, variacoes, setVariacoes }) => {

  const handleOnL = (index) => {
    console.log('orientation to L' + index);
    // const param: ParamProps = variacoes[index];
    // param.orientation = 'L';
  };
  const handleOnC = (index) => {
    console.log('orientation to C' + index);
    // const param: ParamProps = variacoes[index];
    // param.orientation = 'C';
  };
  const handleOnO = (index) => {
    console.log('orientation to O' + index);
    // const param: ParamProps = variacoes[index];
    // param.orientation = 'O';
  };

  return (
    <S.Item>
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