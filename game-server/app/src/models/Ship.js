var _ = require('lodash');
var sylvester = require('sylvester');
var ObjectInSpace = require('./ObjectInSpace');
var util = require('util');

/**
 * Ship model
 *
 * @param {String}  name
 *
 * @constructor
 */
var Ship = function(name) {

    var me = this;

    me._name = name;
    me._creator = null;
    me._players = [];

    me._stations = {
        helm: null,
        weapons: null,
        comm: null,
        science: null,
        engineering: null,
        mainscreen: null
    };

    ObjectInSpace.call(this);

};

util.inherits(Ship, ObjectInSpace);

_.extend(Ship.prototype, {

    _name: null,
    _creator: null,
    _stations: null,
    _players: null,
    _energy: 10000,
    _warpLevel: 0,

    /**
     * Returns the ships name
     *
     * @returns {String}
     */
    getName: function()
    {
        return this._name;
    },

    /**
     * Registeres a player with the ship
     *
     * @param {Player} player
     */
    addPlayer: function(player)
    {
        this._players[player.getId()] = player;
    },

    /**
     * Removes a player from the ship
     *
     * @param {Player} player
     */
    removePlayer: function(player)
    {
        delete this._players[player.getId()];

        this.releaseStation('helm', player);
        this.releaseStation('weapons', player);
        this.releaseStation('engineering', player);
        this.releaseStation('science', player);
        this.releaseStation('mainscreen', player);
        this.releaseStation('comm', player);
    },

    getRealVelocity: function()
    {
        if (this._warpLevel === 0) {
            return this._velocity;
        }
        return this._warpLevel * 299792.458;
    },

    /**
     * Sets the creator of the ship
     *
     * @param {Player} player
     *
     * @returns {Ship}
     */
    setCreator: function(player)
    {
        this._creator = player;
        return this;
    },

    /**
     * Returns the creator of the ship
     *
     * @returns {Player}
     */
    getCreator: function()
    {
        return this._creator;
    },

    /**
     * Returns the current warp level of a ship
     *
     * @returns {Number}
     */
    getWarpLevel: function()
    {
        return this._warpLevel;
    },

    /**
     * Set the current warp level
     *
     * @param {Number} warpLevel
     *
     * @returns {Ship}
     */
    setWarpLevel: function(warpLevel)
    {
        this._warpLevel = warpLevel;
        return this;
    },

    /**
     * Register a player with a station
     *
     * @param {String} station
     * @param {Player} player
     *
     * @returns {boolean}
     */
    takeStation: function(station, player)
    {
        if (this._stations[station]) {
            return false;
        }
        this._stations[station] = player;
        return true;
    },

    /**
     * Releases a station from a player
     *
     * @param {String} station
     * @param {Player} player
     *
     * @returns {boolean}
     */
    releaseStation: function(station, player)
    {
        if (this._stations[station] != player) {
            return false;
        }
        this._stations[station] = null;
        return true;
    },

    /**
     * Returns all stations a player is stationed on
     *
     * @param player
     *
     * @returns {Array}
     */
    stationsForPlayer: function(player)
    {
        var stations = [];
        _(this._stations).each(function (playerOnStation, station) {
            if (playerOnStation && playerOnStation.getId() == player.getId()) {
                stations.push(station);
            }
        });
        return stations;
    },

    /**
     * Sets the available energy of the ship
     *
     * @param {Number} energy
     *
     * @returns {Ship}
     */
    setEnergy: function(energy)
    {
        this._energy = energy;
        return this;
    },

    /**
     * Returns the energy of the ship
     *
     * @returns {Number}
     */
    getEnergy: function()
    {
        return this._energy;
    },

    /**
     * Returns a JSON representation of the ship
     *
     * @returns {{
     *     name: String,
     *     id: Integer,
     *     creator: Player,
     *     stations: {
     *         helm: String,
     *         weapons: String,
     *         science: String,
     *         engineering: String,
     *         comm: String,
     *         mainscreen: String
     *     },
     *     position: {x: Float, y: Float, z: Float},
     *     speed: Float,
     *     heading: {x: Float, y: Float, z: Float}
     * }}
     */
    serialize: function() {
        var me = this,
            heading = me.getHeading();

        var creator;
        if (me._creator) {
            creator = me._creator.serialize();
        }

        var shipX = this._orientation.multiply(sylvester.Vector.create([1, 0, 0]));
        var shipY = this._orientation.multiply(sylvester.Vector.create([0, 1, 0]));

        return {
            name: me.getName(),
            id: me.getId(),
            creator: creator,
            stations: {
                helm: (me._stations.helm ? me._stations.helm.getName() : ''),
                weapons: (me._stations.weapons ? me._stations.weapons.getName() : ''),
                science: (me._stations.science ? me._stations.science.getName() : ''),
                engineering: (me._stations.engineering ? me._stations.engineering.getName() : ''),
                comm: (me._stations.comm ? me._stations.comm.getName() : null),
                mainscreen: (me._stations.mainscreen ? me._stations.mainscreen.getName() : '')
            },
            position: {
                x: me._position.e(1),
                y: me._position.e(2),
                z: me._position.e(3)
            },
            speed: me.getRealVelocity(),
            targetImpulse: me._targetImpulse,
            currentImpulse: me._currentImpulse,
            heading: {
                x: heading.e(1),
                y: heading.e(2),
                z: heading.e(3)
            },
            shipX: {
                x: shipX.e(1),
                y: shipX.e(2),
                z: shipX.e(3)
            },
            shipY: {
                x: shipY.e(1),
                y: shipY.e(2),
                z: shipY.e(3)
            },
            energy: me._energy,
            warpLevel: me._warpLevel
        };
    },

    /**
     * Returns data neede for showing the ship on a map
     *
     * @returns {{
     *     name: String,
     *     id: Integer,
     *     position: {x: *, y: *, z: *},
     *     speed: *,
     *     heading: {x: *, y: *, z: *}
     * }}
     */
    serializeMapData: function()
    {
        var me = this,
            heading = me.getHeading();

        return {
            name: me.getName(),
            id: me.getId(),
            position: {
                x: me._position.e(1),
                y: me._position.e(2),
                z: me._position.e(3)
            },
            speed: me.getRealVelocity(),
            heading: {
                x: heading.e(1),
                y: heading.e(2),
                z: heading.e(3)
            },
            warpLevel: me._warpLevel
        };
    }

});

module.exports = Ship;