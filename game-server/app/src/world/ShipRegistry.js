var _ = require('lodash'),
    pomelo = require('pomelo'),
    models = require('../models'),
    Channel = require('../channel');

var INDEX = 1;
function newIndex() {
    return INDEX++;
}

var channel = new Channel();

/**
 * Registry of all ships
 *
 * @constructor
 */
var ShipRegistry = function()
{
    var me = this;
    me._ships = {};
    me._players = {};
};

_.extend(ShipRegistry.prototype, {

    _ships: null,
    _players: null,

    /**
     * Returns a list of all ships
     *
     * @returns {Array}
     */
    getAllShips: function()
    {
        return _.values(this._ships);
    },

    /**
     * Returns a ship by id
     *
     * @param {Integer} shipId
     *
     * @returns {Ship}
     */
    getShip: function(shipId)
    {
        var me = this;
        var ship = me._ships[shipId];
        return ship;
    },

    /**
     * Adds a ship
     *
     * @param {Ship} ship
     * @param {Player} player
     *
     * @returns {Ship}
     */
    addShip: function(ship, player)
    {
        var me = this,
            index = newIndex();

        ship.setId(index);
        ship.setCreator(player);

        me._ships[index] = ship;

        channel.pushToLobby('ShipAdded', ship.serialize());

        return ship;
    },

    /**
     * Adds a player
     *
     * @param {Player} player
     *
     * @returns {boolean}
     */
    addPlayer: function(player)
    {
        var me = this;
        var playerList = me.getPlayers();

        if (player && !me.isPlayerNameTaken(player.getName())) {
            me._players[player.getId()] = player;
            channel.addPlayerToLobby(player);
            return true
        }

        return false;
    },

    /**
     * Returns a player by its id property
     *
     * @param {Integer} playerId
     *
     * @returns {Player}
     */
    getPlayer: function(playerId)
    {
        var me = this;
        var player = me._players[playerId];
        return player;
    },

    /**
     * Checks if a player name is already taken
     *
     * @param {String} playerName
     * @returns {boolean}
     */
    isPlayerNameTaken: function(playerName) {
        var me = this;
        var playerList = me.getPlayers();

        _(playerList).forEach(function(player) {
            if (player.getName() == playerName) {
                return true;
            }
        });

        return false;

    },

    /**
     * Returns all players
     *
     * @returns {Array}
     */
    getPlayers: function()
    {
        return this._players;
    },

    /**
     * Removes a player
     *
     * @param {Integer} playerId
     */
    removePlayer: function(playerId)
    {
        var me = this;
        var player = me._players[playerId];

        var ship = player.getShip();
        if (ship) {
            player.setShip(null);
            ship.removePlayer(player);
            channel.pushToShip(ship, 'StationReleased', ship.serialize());
        }

        channel.removePlayerFromLobby(player);

        delete me._players[playerId];
    },

    /**
     * Registers a player with a ship
     *
     * @param {Ship} ship
     * @param {Player} player
     */
    addPlayerToShip: function(ship, player)
    {
        ship.addPlayer(player);
        player.setShip(ship);
        channel.addPlayerToShip(ship, player);
    },

    /**
     * Register a player to a station of a ship
     *
     * @param {Ship} ship
     * @param {Player} player
     * @param {String} position
     *
     * @returns {boolean}
     */
    takeStation: function(ship, player, position)
    {
        var success = ship.takeStation(position, player);
        if (success) {
            channel.pushToShip(ship, 'StationTaken', ship.serialize());
        }
        return success;
    },

    /**
     * Releases a player from a station of a ship
     *
     * @param {Ship} ship
     * @param {Player} player
     * @param {String} position
     *
     * @returns {boolean}
     */
    releaseStation: function(ship, player, position)
    {
        var success = ship.releaseStation(position, player);
        if (success) {
            channel.pushToShip(ship, 'StationReleased', ship.serialize());
        }
        return success;
    }

});

module.exports = ShipRegistry;
