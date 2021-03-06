var Stuff    = require('mongoose').model('Stuff'),
    Wish     = require('mongoose').model('Wish'),
    Cart     = require('mongoose').model('Cart'),
    Order    = require('mongoose').model('Order'),
    multer   = require('multer'),
    upload   = multer({dest: 'uploads/'}),
    path     = require('path'),
    fs       = require('fs');

var getErrorMessage = function(err) {
  if (err.errors) {
    for (var errName in err.errors) {
      if (err.errors[errName].message) return err.errors[errName].message;
    }
  } else {
    return 'Unknown server error';
  }
};

exports.uploadImage = upload.single('image');

exports.add = function(req, res) {
  var stuff = new Stuff(req.body);
  stuff.image = req.file.filename;
  stuff.save(function(err) {
    if (err) {
      res.status(400).send({
        message: getErrorMessage(err)
      });
    } else {
      res.sendStatus(200);
    }
  });
};

exports.get = function (req, res) {
  Stuff.find().populate('comments').exec(function(err, stuff){
    if (err) {
      res.status(400).send({
        message: getErrorMessage(err)
      });
    } else {
      res.jsonp(stuff);
    }
  })
}

exports.getImage = function (req, res) {
  res.sendFile(path.resolve('uploads/' + req.params.imageId));
}

exports.findByID = function(req, res, next, id){

  Stuff.findById(id).populate({
    path: 'comments',
    model: 'Comment',

    populate: {
      path: 'user',
      model: 'User',
      select: 'firstName lastName'
    }
  }).exec(function(err, stuff){
    if (err) return next(err);
    if (!stuff) {
      res.status(404).send({message: 'Stuff not found'});
    };
    req.stuff = stuff;
    next();
  })
}

exports.getByID = function(req, res){
  res.jsonp(req.stuff);
}

exports.update = function(req, res){
  var stuff = req.stuff;

  stuff.stufftype = req.body.stufftype;
  stuff.name = req.body.name;
  stuff.description = req.body.description;
  stuff.cost = req.body.cost;

  stuff.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: getErrorMessage(err)
      });
    } else {
      res.sendStatus(200);
    }
  });
}

exports.delete = function(req, res){
  var stuff = req.stuff;

  stuff.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: getErrorMessage(err)
      });
    } else {
      fs.unlinkSync('uploads/' + req.stuff.image);
      res.sendStatus(200);
    }
  });
}

exports.hasAuthorization = function(req, res, next) {
  if (req.user.role != 'Admin') {
    return res.status(403).send({
      message: 'Access denied'
    });
  }
  next();
};
