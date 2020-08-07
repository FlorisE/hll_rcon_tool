import React from 'react'
import {
    Grid, Typography, Button, TextField, Tooltip, Select, Checkbox, FormControlLabel
} from "@material-ui/core"
import { range } from "lodash/util"
import Blacklist from "./blacklist"
import { showResponse, postData } from '../../utils/fetchUtils'
import { toast } from "react-toastify"
import _ from 'lodash'
import LinearProgress from "@material-ui/core/LinearProgress"
import Padlock from '../../components/SettingsView/padlock'
import WarningIcon from '@material-ui/icons/Warning'
import TextHistoryManager from './textHistoryManager'
import TextHistory from '../textHistory'

class RconSettings extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            messages: [],
            randomized: false,
            enabled: false,
            banned_unblacklisted_players: [],
        }

        this.loadBroadcastsSettings = this.loadBroadcastsSettings.bind(this)
        this.getBannedUnblacklistedPlayers = this.getBannedUnblacklistedPlayers.bind(this) 
        this.validate_messages = this.validate_messages.bind(this)
        this.save_messages = this.save_messages.bind(this)
        this.unbanUnblacklistedPlayers = this.unbanUnblacklistedPlayers.bind(this)
        this.clearCache = this.clearCache.bind(this)
    }

    async loadBroadcastsSettings() {
        return fetch(`${process.env.REACT_APP_API_URL}get_auto_broadcasts_config`)
            .then((res) => showResponse(res, "get_auto_broadcasts_config", false))
            .then(data => !data.failed && this.setState({
                messages: data.result.messages,
                randomized: data.result.randomized,
                enabled: data.result.enabled
            }))
    }

    async getBannedUnblacklistedPlayers() {
        return fetch(`${process.env.REACT_APP_API_URL}get_banned_unblacklisted_players`)
            .then((res) => showResponse(res, "get_banned_unblacklisted_players", false))
            .then(data => !data.failed && this.setState({
                banned_unblacklisted_players: data.result
            }))
    }

    async saveBroadcastsSettings(data) {
        return postData(`${process.env.REACT_APP_API_URL}set_auto_broadcasts_config`,
            data
        )
            .then((res) => showResponse(res, "set_auto_broadcasts_config", true))
            .then(res => !res.failed && this.setState(data))
    }

    async blacklistPlayer(steamId, name, reason) {
        return postData(`${process.env.REACT_APP_API_URL}blacklist_player`, {
          "steam_id_64": steamId,
          "name": name,
          "reason": reason,
        })
        .then((res) => showResponse(res, "blacklist_player", true))
    }

    async unbanUnblacklistedPlayers() {
        return postData(`${process.env.REACT_APP_API_URL}unban_unblacklisted_players`, {})
            .then((res) => showResponse(res, "unban_unblacklisted_players", true))
            .then(res => !res.failed && this.getBannedUnblacklistedPlayers())
    }

    async clearCache() {
        return postData(`${process.env.REACT_APP_API_URL}clear_cache`, {})
            .then((res) => showResponse(res, "clear_cache", true))
    }

    validate_messages() {
        let hasErrors = false
        _.forEach(this.state.messages, m => {
            const split = _.split(m, ' ')

            if (_.isNaN(_.toNumber(split[0]))) {
                toast.error(`Invalid line, must start with number of seconds: ${m}`)
                hasErrors = true
            }
        })
        return !hasErrors
    }

    save_messages() {
        if (this.validate_messages()) {
            this.saveBroadcastsSettings({ messages: this.state.messages })
        }
    }

    componentDidMount() {
        this.loadBroadcastsSettings()
        this.getBannedUnblacklistedPlayers()
    }

    render() {
        const { 
          messages,
          enabled,
          randomized,
          banned_unblacklisted_players,
          renewWelcomeMessageOnMapChange,
          renewWelcomeMessagePeriodically,
          renewWelcomeMessagePeriod,
          renewWelcomeMessagePeriodUnit
        } = this.state
        const { classes } = this.props 

        return (
            <Grid container className={classes.paper} spacing={3}>
                <Grid item xs={12}>
                    <h2>Advanced RCON settings</h2>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="h6">Auto broadcast messages</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Grid container justify="space-evenly">
                        <Grid item>
                            <Padlock handleChange={v => this.saveBroadcastsSettings({ enabled: v })} checked={enabled} label="Auto broadcast enabled" />
                        </Grid>
                        <Grid item>
                            <Padlock handleChange={v => this.saveBroadcastsSettings({ randomized: v })} checked={randomized} label="Randomized messages" />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Auto broadcast messages"
                        multiline
                        rows={8}
                        value={_.join(messages.map(m => m.replace(/\n/g, '\\n')), '\n')}
                        onChange={(e) => this.setState({ messages: _.split(e.target.value, '\n') })}
                        placeholder="Insert your messages here, one per line, with format: <number of seconds to display> <a message (write: \n if you want a line return)>"
                        variant="outlined"
                        helperText="You can use the following variables in the text (nextmap, maprotation, servername, onlineadmins, admins, owners, seniors, juniors, vips, randomvip) using the following syntax: 60 Welcome to {servername}. The next map is {nextmap}."
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button fullWidth onClick={this.save_messages} variant="outlined">Save auto broadcast messages</Button>
                </Grid>
                <Grid container spacing={1} alignContent="center" justify="center" alignItems="center" className={classes.root}>
                    <Grid item xs={12} className={`${classes.padding} ${classes.margin}`}>
                        <TextHistoryManager classes={classes} />
                    </Grid>
                </Grid>
                <Grid item className={classes.paddingTop} justify="center" xs={12}>
                  <Typography variant="h6">
                      Blacklist player by Steam ID
                  </Typography>
                </Grid>
                <Blacklist
                    classes={classes}
                    submitBlacklistPlayer={this.blacklistPlayer}
                />
                <Grid item className={classes.paddingTop} justify="center" xs={12}>
                    <Typography variant="h6">
                        More options 
                    </Typography>
                </Grid>
                <Tooltip fullWidth title="This button is active if the server's ban list contains any players who were previously blacklisted. If a player gets unblacklisted an attempt is made to automatically unban the player, but in the case of multiple servers this has to be manually triggered." arrow>
                    <Grid item xs={6} className={`${classes.padding} ${classes.margin}`} alignContent="center" justify="center" alignItems="center" className={classes.root}>
                        <Button color="secondary" variant="outlined" disabled={banned_unblacklisted_players.length === 0} onClick={this.unbanUnblacklistedPlayers}>Unban previously blacklisted players ({banned_unblacklisted_players.length})</Button>
                    </Grid>
                </Tooltip>
                <Grid item xs={6} className={`${classes.padding} ${classes.margin}`} alignContent="center" justify="center" alignItems="center" className={classes.root}>
                    <Button color="secondary" variant="outlined" onClick={this.clearCache}>Clear application cache</Button>
                </Grid>
            </Grid>
        )
    }
}


export default RconSettings
