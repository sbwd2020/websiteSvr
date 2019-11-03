let path = require('path')
let fs = require('fs')

class Log {

  constructor(pre) {
    
    let month =  this.getMonth()
    let day = this.getDay()
    
    let filePath = path.join(__dirname , './../logs', month , day + '-' + pre + '.log')
    let dirPath = path.join(__dirname , './../logs', month)
    // console.log(filePath)
    this.file = filePath
    this.dir = dirPath
  }

  info() {
    let args = arguments || {}
    let infos = [this.formatDateTime(Date.now())]
    for (var key in args) {
      if (args.hasOwnProperty(key)) {
        if (typeof args[key] == 'object'){
          infos.push(JSON.stringify(args[key]))
        }else if (typeof args[key] == 'undefined'){
          infos.push('undefined')
        }else if (typeof args[key] == 'function'){
          infos.push('function')
        }else {
          infos.push(args[key])
        }
        
      }
    }
    let info = infos.join(' | ')

    if (!fs.existsSync(this.dir)){
      fs.mkdirSync(this.dir)
    }
    
    fs.appendFileSync(this.file , info + '\n')
    console.log(info)
  }

  getMonth(){
    var date = new Date(Date.now())
    var y = date.getFullYear()
    var m = date.getMonth() + 1
    m = m < 10 ? ('0' + m) : m
    return (y.toString() + m.toString())
  }

  getDay(){
    var date = new Date(Date.now())
    var d = date.getDate()
    d = d < 10 ? ('0' + d) : d
    return d.toString()
  }

  formatDateTime(inputTime) {
    var date = new Date(inputTime)
    var y = date.getFullYear()
    var m = date.getMonth() + 1
    m = m < 10 ? ('0' + m) : m
    var d = date.getDate()
    d = d < 10 ? ('0' + d) : d
    var h = date.getHours()
    h = h < 10 ? ('0' + h) : h
    var minute = date.getMinutes()
    var second = date.getSeconds()
    minute = minute < 10 ? ('0' + minute) : minute
    second = second < 10 ? ('0' + second) : second
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second
  }

}

module.exports = function (pre) {
  return new Log(pre)
}