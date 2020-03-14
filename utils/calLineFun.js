const JD = 1E-6;

export function showmsg(arg) {
  console.log(arg);
}

//给定数据，分析、计算
//返回值：
//bIsSuccess: 成功为true，失败为false
//ErrMsg: 成功为“OK”，失败为失败信息
//resData: 原始读数
//DATA: 旋转转换后的数据
export function Cal(strdata, jd, kd){
  var strDataArr = [];
  var fDataArr = [];
  var fSZ = [];
  var fjd, fkd;
  var iTmp, jTmp;

  //分解、整理、检查输入读数
  strDataArr = strdata.split("\n");
  jTmp = 1;
  fDataArr[0] = 0;
  for (iTmp = 0; iTmp < strDataArr.length; iTmp++) {
    if (strDataArr[iTmp] != "") {
      fDataArr[jTmp] = Number(strDataArr[iTmp]);
      if( isNaN(fDataArr[jTmp]) ){
        return {
          bIsSuccess: false,
          ErrMsg: "输入的读数中包含非数字内容：" + strDataArr[iTmp],
          DATA: null
        }
      }
      jTmp++;
    }
  }
  if(fDataArr.length<3){
    return {
      bIsSuccess: false,
      ErrMsg: "输入数据量不足",
      DATA: fDataArr
    };
  }
  //检查仪器精度及桥板跨度
  if(isNaN(jd) || isNaN(kd)){
    return {
      bIsSuccess: false,
      ErrMsg: "仪器精度或桥板跨度数据输入有误",
      DATA: fDataArr
    };
  }else{
    fjd = Number(jd);
    fkd = Number(kd);
    if(fjd<=0 || fkd<=0){
      return {
        bIsSuccess: false,
        ErrMsg: "仪器精度或桥板跨度数据输入有误",
        DATA: fDataArr
      };
    }
  }
  
  var fMaxVal;
  //克隆数组
  for(iTmp=0; iTmp<fDataArr.length; iTmp++){
    fSZ[iTmp] = fDataArr[iTmp];
  }
  fMaxVal = Cal_0(fDataArr, fSZ);
  for (iTmp = 0; iTmp < fSZ.length; iTmp++){
    fSZ[iTmp] = Math.round(fSZ[iTmp] * jd * kd * 10.0)/100;
  }
  if (-1 != fMaxVal){
    return {
      bIsSuccess: true,
      ErrMsg: "OK",
      resData: fDataArr,
      DATA: fSZ,
      MAX_VALUE: Math.round(fMaxVal * jd * kd * 10.0)/100
    };
  }else {
    return {
      bIsSuccess: false,
      ErrMsg: "最小包容区域法评定直线度失败！",
      DATA: fSZ
    };
  }
}

//计算直线度
//输入fArr原始数据组，输出fSZ旋转处理后的数据
//返回最大数据，未找到返回-1
function Cal_0(fArr, fSZ) {
  var iT;
  var fRt;

  //数据整理
  for (iT = 1; iT < fSZ.length; iT++)
    fSZ[iT] += fSZ[iT - 1];

  if (Z_PD(fSZ))
    fRt = GetMaxVal(fSZ);
  else {
    //数据反向后重新
    fSZ[0] = -fArr[0];
    for (iT = 1; iT < fSZ.length; iT++)
      fSZ[iT] = -fArr[iT] + fSZ[iT - 1];
    if (Z_PD(fSZ)) {
      fRt = GetMaxVal(fSZ);
      for (iT = 0; iT < fSZ.length; iT++)
        fSZ[iT] = fRt - fSZ[iT];
    } else
      fRt = -1;
  }
  return fRt;
}

//判断一个数据是否为0
function IsZero(fVal) {
  var bRt;
  if (Math.abs(fVal) <= JD)
    bRt = true;
  else
    bRt = false;

  return bRt;
}

//找到最小数据位置
function GetMinPos(fSZ) {
  var fMin;
  var iRt = 0,
    iTmp;
  fMin = fSZ[0];
  for (iTmp = 0; iTmp < fSZ.length; iTmp++) {
    if (fSZ[iTmp] < fMin) {
      fMin = fSZ[iTmp];
      iRt = iTmp;
    }
  }
  return iRt;
}

//找到最大数据位置
function GetMaxPos(fSZ) {
  var fMax;
  var iRt = 0,
    iTmp;
  fMax = fSZ[0];
  for (iTmp = 0; iTmp < fSZ.length; iTmp++) {
    if (fSZ[iTmp] > fMax) {
      fMax = fSZ[iTmp];
      iRt = iTmp;
    }
  }
  return iRt;
}

//找到最大数据
function GetMaxVal(fSZ) {
  var fMax;
  var iTmp;
  fMax = fSZ[0];
  for (iTmp = 0; iTmp < fSZ.length; iTmp++) {
    if (fSZ[iTmp] > fMax)
      fMax = fSZ[iTmp];
  }
  return fMax;
}

//获取左右0点位置，iLR[0]=左点，iLR[1]=右点
function GetL_R_ZeroPos(fSZ, iLR) {
  var iT;
  iLR[0] = iLR[1] = -1;
  for (iT = 0; iT < fSZ.length; iT++) {
    if (IsZero(fSZ[iT])) {
      if (iLR[0] == -1) {
        iLR[0] = iT;
        iLR[1] = iT;
      } else
        iLR[1] = iT;
    }
  }
}

//判断给定的最大数据是否在两点之间有相同值
function HasSameVal(fSZ, iL, ir, fMax) {
  var bRt = false;
  var iTmp;
  for (iTmp = iL + 1; iTmp < ir - 1; iTmp++)
    if (IsZero(fSZ[iTmp] - fMax)) {
      bRt = true;
      break;
    }
  return bRt;
}

//判断数据是否符合最小包容区域规则(所有数据均大于0)
function IsMinB(fSZ) {
  var iLR = [];
  var iPos;
  var bRt;

  GetL_R_ZeroPos(fSZ, iLR);
  if (iLR[1] > iLR[0]) {
    iPos = GetMaxPos(fSZ);
    if (iPos >= iLR[0] && iPos <= iLR[1]) // 最大数据是否落在两0之间
      bRt = true;
    else if (HasSameVal(fSZ, iLR[0], iLR[1], fSZ[iPos])) //两点之间最大值与区间外最大值相同
      bRt = true;
    else
      bRt = false;
  } else
    bRt = false;
  return bRt;
}

//旋转一次并返回旋转量(正值向右旋转，负值向左旋转)
function RotOnce(fSZ) {
  var iLR = [];
  var iT;
  var fTmp;

  GetL_R_ZeroPos(fSZ, iLR);
  if (GetMaxPos(fSZ) > iLR[1]) // 向右旋转
  {
    fTmp = fSZ[iLR[1] + 1];
    for (iT = iLR[1] + 1; iT < fSZ.length; iT++) // 寻找最小旋转量
    {
      if (fTmp > fSZ[iT] / (iT - iLR[1]))
        fTmp = fSZ[iT] / (iT - iLR[1]);
    }
    // 左侧旋转
    for (iT = 0; iT < iLR[1]; iT++)
      fSZ[iT] += fTmp * (iLR[1] - iT);
    // 右侧旋转
    for (iT = iLR[1] + 1; iT < fSZ.length; iT++)
      fSZ[iT] -= fTmp * (iT - iLR[1]);
  } else {
    fTmp = fSZ[0] / (iLR[0]);
    for (iT = 0; iT < iLR[0]; iT++) // 寻找最小旋转量
    {
      if (fTmp > fSZ[iT] / (iLR[0] - iT))
        fTmp = fSZ[iT] / (iLR[0] - iT);
    }
    fTmp = -fTmp;
    // 左侧旋转
    for (iT = 0; iT < iLR[0]; iT++)
      fSZ[iT] += fTmp * (iLR[0] - iT);
    // 右侧旋转
    for (iT = iLR[0] + 1; iT < fSZ.length; iT++)
      fSZ[iT] -= fTmp * (iT - iLR[0]);
  }
  return fTmp;
}

//所有数据转正旋转，存在最小包容区间返回True，否则返回False
function Z_PD(fSZ) {
  var iTmp;
  var fTmp, fOldDir = 1;
  var bFirst, bRt;

  fTmp = fSZ[GetMinPos(fSZ)];
  fTmp = -fTmp;
  // 所有数据转正
  for (iTmp = 0; iTmp < fSZ.length; iTmp++)
    fSZ[iTmp] += fTmp;
  bFirst = true;
  bRt = true;
  while (IsMinB(fSZ) == false && bRt == true) {
    if (bFirst == false) {
      fTmp = RotOnce(fSZ); //本次（非首次）图形旋转方向
      if (fTmp * fOldDir < 0) // 旋转方向反向，表示数据不是底-高-底规律
        bRt = false;
      fOldDir = fTmp;
    } else {
      fOldDir = RotOnce(fSZ); //首次图形旋转方向
      bFirst = false;
    }
  }
  return bRt;
}