/// <reference path="../../../typings/index.d.ts" />

import * as express from 'express';

let router = express.Router();

router.get('*', (req, res) => {
            // res.sendFile(__dirname + '/../public/index.html');
            //res.render(__dirname + '/../public/index.html');
    // res.send('wooo')
});



export default router