const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const path = require("path");
const https = require('https');
const axios = require('axios').default;
const fs = require('fs');
require('dotenv').config();

const app = express();
const router = express.Router();

// USE middleware are executed every time a request is receieved
// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use('/api', router);

let url, displayName, inceptionName;
if(process.env.API_VERSION == "old"){
    displayName = "displayName";
    inceptionName = "updated";
    url = "https://api.yearn.tools/vaults/all";
}
if(process.env.API_VERSION == "new"){
    displayName = "display_name";
    inceptionName = "inception";
    url = "https://api.yearn.finance/v1/chains/1/vaults/all";
}
console.log(displayName)
app.get('/search', function(req, res) {
    vaultName = req.query.vaultName.toLowerCase();
    let old = false;
    if(vaultName.includes("-old")){
        old = true;
        vaultName = vaultName.split("-")[0];
    }
    inception = 0;
    axios.get(url)
    .then(response => {
        // handle success
        let address = 0;
        hits = [];
        hit = {};
        found = false;
        for(let i = 0; i<response.data.length;i++){
            hit = {};
            let name = (response.data[i][displayName]).toLowerCase();
            if(response.data[i].endorsed){
                if(name == vaultName.toLowerCase()){
                    if(response.data[i].type == "v2"){
                        address = response.data[i].address;
                        console.log(response.data[i].address);
                        console.log(response.data[i][displayName]);
                        console.log(response.data[i].name);
                        hit.address = response.data[i].address;
                        hit.inception = response.data[i][inceptionName];
                        hits.push(hit);
                        found = true;
                    }
                }
                else if(name.includes((vaultName).toLowerCase()) && !found){
                    if(response.data[i].type == "v2"){
                        address = response.data[i].address
                        console.log(response.data[i].address);
                        console.log(response.data[i][displayName]);
                        console.log(response.data[i].name);
                        hit.address = response.data[i].address;
                        hit.inception = response.data[i][inceptionName];
                        hits.push(hit);
                    }
                }
            }            
        }
        for(let i = 0;i<hits.length;i++){
            if(old){
                if(inception > hits[i].inception){
                    address = hits[i].address;
                }
            }
            else{
                if(inception < hits[i].inception){
                    address = hits[i].address;
                }
            }
        }
        console.log("CANONICAL",address)
        if(address=="0" || address==0){
            redirectUrl = 'https://yearn.watch';
        }
        else{
            redirectUrl = 'https://yearn.watch/vault/'+address;
        }
        res.redirect(redirectUrl);
    })
    .catch(error => {
        // handle error
        console.log(error);
    })
    
  });

//PROD
if(process.env.PROD==="true"){
  console.log("Environment: Prod")
  https.createServer({
    key: fs.readFileSync(process.env.CERT_KEY_PATH),
    cert: fs.readFileSync(process.env.CERT_PATH)
  }, app).listen(process.env.PORT || process.env.API_PORT, () => console.log(`LISTENING ON PORT ${process.env.PORT || process.env.API_PORT}`));
}

//NOT PROD
if(process.env.PROD==="false"){
  console.log("Environment: Non-prod")
  app.listen(process.env.PORT || process.env.API_PORT, () => console.log(`LISTENING ON PORT ${process.env.PORT || process.env.API_PORT}`));
}