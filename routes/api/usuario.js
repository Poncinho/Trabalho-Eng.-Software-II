const router = require("express").Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const keys = require("../../config/keys");
const Usuario = require("../../db/models").Usuario;
const Dentista = require("../../db/models").Dentista;
const Clinica = require("../../db/models").Clinica;

/**
 * Testa funcionalidade de login
 */
router.get(
  "/test",
  passport.authenticate("user", { session: false }),
  (req, res) => {
    res.status(200).send(req.user);
  }
);

/**
 * Register a new user
 */
router.post(
  "/register",
  passport.authenticate("user", { session: false }),
  (req, res) => {
    let userFields = {
      login: req.body.login,
      senha: req.body.senha
    };

    Clinica.findOne({
      where: {
        id: req.user.Dentista[0].Clinicas[0].id
      }
    }).then(clinica => {
      Usuario.findOrCreate({
        where: {
          login: userFields.login
        },
        defaults: userFields
      })
        .then(([usuario, created]) => {
          if (!created) {
            return res.status(400).send({
              error: {
                userExists: "Usuário já existe na base de dados"
              }
            });
          }

          let dentistaFields = {
            nome: req.body.nome,
            registro_cro: req.body.registro_cro,
            cpf: req.body.cpf,
            rg: req.body.rg,
            usuario_id: usuario.id,
            tipoDentista_id: req.body.tipoDentista_id
          };

          Dentista.create(dentistaFields).then(dentista => {
            clinica.addDentista(dentista);
            return res.status(200).send({ success: true, usuario });
          });
        })
        .catch(err => {
          console.log(err);
        });
    });
  }
);

/**
 * Login a user
 */
router.post("/login", (req, res) => {
  let loginFields = {
    login: req.body.login,
    senha: req.body.senha
  };

  Usuario.findOne({
    where: {
      login: loginFields.login
    },
    include: [Dentista]
  }).then(usuario => {
    if (!usuario) {
      return res
        .status(404)
        .send({ error: { noUser: "Nenhum usuario encontrado" } });
    }

    if (usuario.senha !== loginFields.senha) {
      return res
        .status(401)
        .send({ error: { password: "Senha não coincide" } });
    }

    const payload = {
      id: usuario.id,
      login: usuario.login,
      dentista: usuario.Dentista
    };

    jwt.sign(payload, keys.secretOrKey, { expiresIn: 43200 }, (err, token) => {
      if (err) {
        console.log(err);
      }

      return res.status(200).send({
        success: true,
        usuario,
        token: `Bearer ${token}`
      });
    });
  });
});

module.exports = router;
