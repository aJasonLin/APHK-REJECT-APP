const data = `"貨主ID","通知返品日","返品入倉日","返品類型","訂單編號","客戶名","出貨配送單號","退貨配送單號","返品商品貨號","返品商品數量","判定","發票回收","備註","返品處理日","退款日","發票日期"
"APHK-CC","3月1日","3月1日","拒收","500003054","WongZoe","SF6026509521991","0","4589402860017 ","2","良品","","","3月1日","",""
"APHK-CC","3月1日","3月1日","拒收","500003054","WongZoe","SF6026509521991","0","spoon001","1","良品","","","3月1日","",""
"APHK-CC","3月1日","3月1日","拒收","500003054","WongZoe","SF6026509521991","0","blanket01","1","良品","","","3月1日","",""
"APHK-SV","3月1日","3月1日","拒收","510001601","TsangKa Li Carmen","SF6026510896578","0","4541049000164 ","3","良品","","","3月1日","",""
"APHK-SV","3月1日","3月1日","拒收","510001601","TsangKa Li Carmen","SF6026510896578","0","DMSUB001HK","1","良品","","","3月1日","",""
"APHK-SV","3月1日","3月1日","拒收","510001601","TsangKa Li Carmen","SF6026510896578","0","S005","1","良品","","","3月1日","",""
`

export const arrange = (data) => {
    const dataList = data.split("\n")
    let result = {
        "APHK-CC": dataList[0],
        "APHK-SV": dataList[0],
        "APHK-AD": dataList[0]
    }
    dataList.map((data, i) => {
        if (i === 0) {
            return
        }
        const type = data.split('"')[1]
        if (type) {
            result[type] += `\n${data}`
        }
    })
    // console.log(result)
    return result

}
// arange(data)