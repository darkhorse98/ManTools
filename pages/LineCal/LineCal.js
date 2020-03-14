// pages/LineCal/LineCal.js
import {
  showmsg,
  Cal
} from '../../utils/calLineFun.js';
const util = require('../../utils/util.js');

var ctx = null;
var canvas_width = 375;
var canvas_height = 120;
var fRatio = 1;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    items: [{
        name: 'SPY',
        value: '框式水平仪',
        checked: 'true'
      },
      {
        name: 'ZZY',
        value: '准直仪'
      },
      {
        name: 'CUSTOM',
        value: '自定义'
      }
    ],
    values: '',
    yqjd: '0.02',
    bEnable_yqjd: false,
    bk_yqjd: '#A0A0A0',
    qbkd: '500',
    bCalBtnEnable: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    //获取设备像素比
    wx.getSystemInfo({
      success(res) {
        fRatio = res.pixelRatio;
      }
    })
    // 通过 SelectorQuery 获取 Canvas 信息
    wx.createSelectorQuery()
      .select('#canvas')
      .fields({
        node: true,
        size: true,
      })
      .exec(this.init.bind(this))
  },
  init(res) {
    canvas_width = res[0].width
    canvas_height = res[0].height
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  /**
   * 选择仪器/设定仪器精度
   */
  radioChange: function(e) {
    switch (e.detail.value) {
      case 'CUSTOM':
        this.setData({
          bEnable_yqjd: true,
          bk_yqjd: '#FFFFFF'
        });
        break;
      case 'SPY':
        this.setData({
          yqjd: '0.02',
          bEnable_yqjd: false,
          bk_yqjd: '#A0A0A0'
        });
        break;
      case 'ZZY':
        this.setData({
          yqjd: '0.005',
          bEnable_yqjd: false,
          bk_yqjd: '#A0A0A0'
        });
        break;
    }
  },

  /**
   * 读数输入
   */
  dataInput: function(e) {
    this.setData({
      values: e.detail.value
    })
  },

  /**
   * 仪器精度输入
   */
  jdInput: function(e) {
    this.setData({
      yqjd: e.detail.value
    })
  },

  /**
   * 桥板跨度输入
   */
  qbInput: function(e) {
    this.setData({
      qbkd: e.detail.value
    })
  },

  /**
   * 计算直线度并画图
   */
  calLine: function(e) {
    var rt = Cal(this.data.values, this.data.yqjd, this.data.qbkd);
    if (rt.bIsSuccess) {
      this.drawLine(rt);
      wx.showToast({
        title: '完成',
        icon: 'success',
        duration: 1500
      })
    } else {
      wx.showModal({
        title: '错误',
        content: rt.ErrMsg,
        showCancel: false
      })
    }
  },

  drawLine: function(arg) {
    var iTmp;
    var rect = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    var px, py;

    rect.left = 10;
    rect.right = canvas_width - 10;
    rect.top = canvas_height / 3;
    rect.bottom = canvas_height - 50;
    var scv = (rect.bottom - rect.top) / arg.MAX_VALUE;
    var sch = (rect.right - rect.left) / (arg.DATA.length - 1);
    
    ctx = wx.createCanvasContext('canvas');
    //填充背景色（否则保存图片为全黑底色）
    ctx.beginPath();
    ctx.setFillStyle('#FFFFA0');
    ctx.fillRect(0, 0, canvas_width, canvas_height);
    ctx.stroke();
    //画位置线及各点直线度数据
    ctx.beginPath();
    ctx.setStrokeStyle("#808080");
    ctx.moveTo(rect.left, rect.bottom);
    ctx.lineTo(rect.right, rect.bottom);
    for (iTmp = 0; iTmp < arg.DATA.length; iTmp++) {
      px = rect.left + iTmp * sch;
      py = rect.bottom - arg.DATA[iTmp] * scv;
      ctx.moveTo(px, rect.bottom);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    //写原始读数
    ctx.beginPath();
    ctx.setFontSize(10);
    ctx.setFillStyle("black");
    var strResData = [];
    var fRowWidth, curW;
    var iRow;
    for(iTmp=1; iTmp<arg.resData.length-1; iTmp++){
      strResData[iTmp-1] = String(arg.resData[iTmp]) + ", ";
    }
    strResData[iTmp - 1] = String(arg.resData[iTmp]);
    ctx.fillText("记录数据(" + strResData.length + "):", 5, rect.bottom + 15);
    iRow = 0;
    fRowWidth = 5;
    for(iTmp=0; iTmp<strResData.length; iTmp++){
      curW = ctx.measureText(strResData[iTmp]).width;
      if(curW>canvas_width){  //单个数据长度大于屏幕宽度，无法记录
        break;
      }
      if(fRowWidth+curW>canvas_width-10){  //换行
        iRow++;
        fRowWidth = 5;
      }
      ctx.fillText(strResData[iTmp], fRowWidth, rect.bottom+iRow*14+30);
      fRowWidth += curW;
    }
    ctx.stroke();
    //写直线度数据
    ctx.save();
    ctx.beginPath();
    ctx.setFontSize(10);
    ctx.setTextBaseline('middle');
    ctx.rotate(-90 * Math.PI / 180);
    for (iTmp = 0; iTmp < arg.DATA.length; iTmp++) {
      px = rect.left + iTmp * sch;
      py = rect.bottom - arg.DATA[iTmp] * scv;
      ctx.fillText(String(arg.DATA[iTmp]), -py+5, px); 
    }
    ctx.stroke();
    ctx.restore();
    //画直线度曲线
    ctx.beginPath();
    ctx.setStrokeStyle("#00FF00");
    ctx.moveTo(rect.left, rect.bottom - arg.DATA[0] * scv);
    for (iTmp = 1; iTmp < arg.DATA.length; iTmp++) {
      ctx.lineTo(rect.left + iTmp * sch, rect.bottom - arg.DATA[iTmp] * scv);
    }
    //说明文字
    //ctx.setFillStyle("#0000FF");
    var strDate = util.formatTime(new Date());
    ctx.setFontSize(14);
    ctx.fillText('直线度 = ' + arg.MAX_VALUE + ' 丝', 2, 14);
    ctx.fillText(strDate, canvas_width-ctx.measureText(strDate).width-2, 14);
    ctx.stroke();

    ctx.draw();
  },

  /**
   * 将直线度图片存入系统
   */
  savePic: function(e) {
    wx.showModal({
      title: '提示',
      content: '是否要保存下方图片？',
      success(res) {
        if (res.confirm) {
          //console.log('用户点击确定')
          wx.canvasToTempFilePath({
            canvasId: 'canvas',
            fileType: 'png',
            destWidth: canvas_width * fRatio,
            destHeight: canvas_height * fRatio,
            success: function (res) {
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success(res) {
                  wx.showToast({
                    title: '保存成功',
                    icon: 'success',
                    duration: 1500
                  });
                },
                fail() {
                }
              })
            }
          })
        } else if (res.cancel) {
        }
      }
    })
  }
})