import fs from 'fs'
import path from 'path';
export const CheckInMemo = async (filesToCheck, folder) => {
    const hasRead = path.join(process.cwd(), 'hasRead.json');
    const data = await fs.promises.readFile(hasRead)
    let obj = JSON.parse(data); //now it an object
    const currentFolder = obj.currentFolder;
    if(currentFolder!=folder.name&&currentFolder){
        obj.fileNames = []
        obj.currentFolder = folder.name
    }
    else if(!currentFolder){
        obj.currentFolder = folder.name
    }
    let files = obj.fileNames
    const filesIWant = files.length > 0 ? filesToCheck.filter((file) => {
        let bool = true;
        files.forEach((f) => {
            if (f.name == file.name) {
                console.log("include", file.name)
                bool = false
                return
            }
        })
        if(bool)console.log("not include", file.name)
        return bool
    }) : filesToCheck
    obj.fileNames = [...obj.fileNames, ...filesIWant]
    let json = JSON.stringify(obj); //convert it back to json
    fs.writeFile('hasRead.json', json, 'utf8', function (err) {
        if (err) throw err;
        console.log('complete');
    });
    return filesIWant

}