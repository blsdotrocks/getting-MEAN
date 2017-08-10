const mongoose = require('mongoose');
const Loc = mongoose.model('Location');

const theEarth = (() => {
	const earthRadius = 6371; //valor em km, em milhas seria 3959

	const getDistanceFromRads = (rads) => {
		return parseFloat(rads * earthRadius);
	};

	const getRadsFromDistance = (distance) => {
		return parseFloat(distance / earthRadius);
	};

	return {
		getDistanceFromRads: getDistanceFromRads,
		getRadsFromDistance: getRadsFromDistance
	};
})();

const sendJsonResponse = (res, status, content) => {
	res.status(status);
	res.json(content);
};

module.exports.locationsCreate = (req, res) => {
	Loc.create({
		name: req.body.name,
		address: req.body.address,
		facilities: req.body.facilities.split(","),
		coords: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
		openingTimes:[{
			days: req.body.days1,
			opening: req.body.opening1,
			closing: req.body.closing1,
			closed: req.body.closed1,
		},{
			days: req.body.days2,
			opening: req.body.opening2,
			closing: req.body.closing2,
			closed: req.body.closed2
		}]
	}, (err, location) => {
		if (err) {
			sendJsonResponse(res, 400, err);
		}

		else {
			sendJsonResponse(res, 201, location);
		}
	});
};

module.exports.locationsListByDistance = (req, res) => {
	let lng = parseFloat(req.query.lng);
	let lat = parseFloat(req.query.lat);

	let point = {
		type: "Point",
		coordinates: [lng, lat]
	};

	const getOptions = {
		spherical: true,
		maxDistance: theEarth.getRadsFromDistance(20),
		num: 10
	};

	if (!lng || !lat) {
		sendJsonResponse(res, 404, {
			"messagem": "lng and lat query parameters are required"
		});
		return;
	}

	Loc.geoNear(point, getOptions, (err, results, stats) => {
		let locations = [];

		if (err) {
			sendJsonResponse(res, 404, err);
		}

		else {
			results.forEach((doc) => {
				locations.push({
					distante: theEarth.getDistanceFromRads(doc.dis),
					name: doc.obj.name,
					address: doc.obj.address,
					rating: doc.obj.rating,
					facilities: doc.obj.facilities,
					_id: doc.obj._id
				});
			});
			sendJsonResponse(res, 200, locations);
		}
	});
};

module.exports.locationsReadOne = (req, res) => {
	if(req.params && req.params.locationid) {
		Loc
			.findById(req.params.locationid)
			.exec((err, location) => {
				if (!location) {
					sendJsonResponse(res, 404, {
						"message": "locationid not found"
					});
					return;
				}
				
				else if (err) {
					sendJsonResponse(res, 400, err);
					return;
				}

				sendJsonResponse(res, 200, location);
			});
	}

	else {
		sendJsonResponse(res, 400, {
			"message": "no locationid in request"
		});
	}
};

module.exports.locationsUpdateOne = (req, res) => {
	if (!req.params.locationid) {
		sendJsonResponse(res, 404, {
			"message": "not found, locationid is required"
		});
		return;
	}
	Loc
		.findById(req.params.locationid)
		.select("-reviews -rating")
		.exec((err, location) => {
			if(!location) {
				sendJsonResponse(res, 404, {
					"message": "locationid not found"
				});
				return;
			}

			else if (err) {
				sendJsonResponse(res, 400, err);
				return;
			}
			location.name = req.body.name;
			location.address = req.body.address;
			location.facilities = req.body.facilities.split(",");
			location.coords = [parseFloat(req.body.lng), parseFloat(req.body.lat)];
			location.openingTimes = [{
				days: req.body.days1,
				opening: req.body.opening1,
				closing: req.body.closing1,
				closed: req.body.closed1
			},{
				days: req.body.days2,
				opening: req.body.opening2,
				closing: req.body.closing2,
				closed: req.body.closed2
			}];
			location.save((err, location) => {
				if(err) {
					sendJsonResponse(res, 404, err);
				}

				else {
					sendJsonResponse(res, 200, location);
				}
			});
		});
};

module.exports.locationsDeleteOne = (req, res) => {
	let locationid = req.params.locationid;
	if (locationid) {
		Loc
			.findByIdAndRemove(locationid)
			.exec((err, location) => {
				if (err) {
					sendJsonResponse(res, 404, err);
					return;
				}
				sendJsonResponse(res, 204, null);
			})
	}

	else {
		sendJsonResponse(res, 404, {
			"message": "no locationid"
		});
	}
};