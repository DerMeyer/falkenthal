const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;

const spicedPg = require('spiced-pg');
const db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:postgres@localhost:5432/falkenthal');

const { s3upload } = require('./s3');
const { s3Url } = require('./config');
const { MY_SECRET, ADMIN_PASSWORD } = (process.env.NODE_ENV === 'production' && process.env) || require('./confidential.json');

const multer = require('multer');
const uidSafe = require('uid-safe');
const path = require('path');
const diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, `${__dirname}/uploads`);
    },
    filename: function (req, file, callback) {
      uidSafe(24).then(function(uid) {
          callback(null, uid + path.extname(file.originalname));
      });
    }
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 4194304
    }
});

const cookieSession = require('cookie-session');
const cookieSessionMiddleware = cookieSession({
    secret: MY_SECRET,
    maxAge: 1000 * 60 * 60 * 24 * 1
});
app.use(cookieSessionMiddleware);

const csurf = require('csurf');
app.use(csurf());
app.use((req, res, next) => {
    res.cookie('mytoken', req.csrfToken());
    next();
});

const compression = require('compression');
app.use(compression());

const bp = require('body-parser');
app.use(bp.json());

app.use(express.static(`${__dirname}/public`));

app.get('/logout', (req, res) => {
    req.session = null;
    res.json({
        success: true,
        message: 'Du bist jetzt ausgelogged.'
    });
});

app.post('/login', (req, res) => {
    if (req.body.pw === ADMIN_PASSWORD) {
        req.session.admin = true;
        res.json({
            success: true
        });
    } else {
        res.json({
            success: false,
            message: 'Falsches Passwort.'
        });
    }
});

app.post('/upload_image', uploader.single('file'), s3upload, async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    if (req.file) {
        try {
            const url = `${s3url}${req.file.filename}`;
            const result = await db.query(
                'INSERT INTO images (folder_id, url, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
                [req.body.folder_id, url, req.body.name, req.body.description]
            );
            if (req.body.is_title_img) {
                await db.query(
                    'UPDATE folders SET title_img_url = $1 WHERE id = $2',
                    [url, req.body.folder_id]
                );
            }
            res.json({
                success: true,
                image: result.rows[0]
            });
        } catch (err) {
            console.log(err);
            res.json({
                success: false,
                message: 'Beim Upload ist etwas schiefgelaufen. Sag am besten Simon bescheid.'
            });
        }
    } else {
        res.json({
            success: false,
            message: 'Sieht aus, als ob das Bild zu groß wär. Bist du unter 4MB?'
        });
    }
});

app.listen(PORT, () => console.log(`I'm listening on port ${PORT}`));