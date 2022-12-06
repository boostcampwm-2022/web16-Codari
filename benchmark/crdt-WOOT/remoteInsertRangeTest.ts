import Char from "./crdt/char";
import { CRDT } from "./crdt/crdt";

interface Template {
  [key: string] : string
}

interface TestType {
  [key: string] : Function
}

const testType: TestType = {
  "BEST" : (index: number, testFunc : any, funcParams: any) => {
    testFunc(funcParams);
  },
  "WORST" : (index: number, testFunc : any, funcParams: any) => {
    testFunc(funcParams);
  },
  "RANDOM" : (index: number, testFunc : any, funcParams: any) => {
    testFunc(funcParams);
  }
}

const calcTimeDiff = (testFunc : any, funcParams: any[], time: number, type : string) : string => {
  const startTime = performance.now();
  for (let i = 0; i < time; i++) {
    testType[type](i,testFunc, funcParams[0][i]);
  }
  const endTime = performance.now();
  return `${endTime - startTime}ms`;
}

const remoteInsertRangeBenchmark = (type : string) => {
  const template : Template = {
    '10' : "",
    '100' : "",
    '1000' : "",
    '10000' : "",
  };

  let crdt;
  let operationTime;
  let caseLength = Object.keys(template).length;
  
  for (let i = 1; i <= caseLength; i++) {
    crdt = new CRDT();
    const crdtOthers = new CRDT();
    const operationHistory: Char[][] = [];
    operationTime = Math.pow(10, i);

    for(let j = 0; j < operationTime; j++) {
      crdtOthers.localInsert(0, 'a');
    }
    crdt.syncDocument(crdtOthers.charMap);

    if (type === "BEST") {
        for(let k = 0; k < operationTime; k++) {
          operationHistory.push([...crdtOthers.localInsertRange(0, 'abc')].map((char) => {return {...char}}));
        }
    } else if (type === "WORST") {
        for(let k = 0; k < operationTime; k++) {
          operationHistory.push([...crdtOthers.localInsertRange(Math.floor(operationTime/2), 'abc')].map((char) => {return {...char}}));
        }
        
    } else if (type === "RANDOM") {
        for(let k = 0; k < operationTime; k++) {
          operationHistory.push([...crdtOthers.localInsertRange(Math.floor(Math.random() * (operationTime + k + 1)), 'abc')].map((char) => {return {...char}}));
        }
    }
    
    template[operationTime.toString()] = calcTimeDiff(crdt.remoteInsert.bind(crdt), [operationHistory], operationTime, type);
  }
  
  console.table(template);
}

export { remoteInsertRangeBenchmark };
