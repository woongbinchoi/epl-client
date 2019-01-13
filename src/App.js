import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import { Chart } from "react-google-charts";
import axios from 'axios';
import logo from './premier_league_logo.svg';
import './App.scss';


class Home extends Component {
    state = {
        summary: {},
        is_loaded: false
    }

    componentDidMount() {
        axios.get('https://epl-server.herokuapp.com/summary')
            .then(response => {
                console.log(response.data);
                this.setState({ summary: response.data, is_loaded: true });
            });
    }

    render() {
        return (
            <div className='home'>
                <h2 className='content_header'>Summary</h2>
                {this.state.is_loaded && 
                    <div>
                        <p>Most likely to win the season: <b>{this.state.summary.winner}</b></p>
                        <p>Prediction Accuracy: <b>{Math.round(this.state.summary.accuracy * 10000) / 100}%</b></p>
                        <p>Last Update: <b>{this.state.summary.time}</b></p>
                    </div>
                }
                <br/>
                <h2 className='content_header'>Help</h2>
                <p>If you would like to look at match predictions, <b><a href='/predictions'>Click Predictions</a></b>.</p>
                <p>If you would like to look at previous matches of the current season, <b><a href='/results'>Click Results</a></b>.</p>
                <p>If you would like to look at the current standing as well as predicted standings, <b><a href='/standings'>Click Standings</a></b>.</p>
                <p>If you would like to look at github repo of this website, <b><a href='https://github.com/woongbinchoi/English-Premier-League-Prediction'>Click here</a></b>.</p>
                <p>If you have any questions for the developer, <b><a href='mailto:woongbinchoi@gmail.com'>Please contact me</a></b>.</p>
            </div>
        );
    }
}


class Standings extends Component {
    state = {
        posts: [],
        options: {
            width: "100%",
            height: "600px",
            chartArea: {top: '5%', width: '90%', height: '80%'},
            legend: { position: 'bottom' },
            vAxis: { direction: -1}
        },
        is_loaded: false
    }

    componentDidMount() {
        axios.get('https://epl-server.herokuapp.com/rankings')
            .then(response => {
                let res = response.data;
                let matrix =[];
                let columns = [];
                if (res.length > 0) {
                    Object.keys(res[0]).forEach(function(key) {
                        if (key !== 'Date') columns.push([key, res[0][key]]);
                    });
                    columns.sort(function(first, second) {
                        return second[1] - first[1];
                    });
                    columns = columns.map(function(item) {
                        return item[0];
                    });
                    columns.unshift('Date');
                    matrix.push(columns);

                    res[0]['Date'] = 'Present';
                    res[res.length - 1]['Date'] = 'Final';
                }

                if (res.length > 9) {
                    let new_res = [];
                    let it = res.length / 9;
                    new_res.push(res[0]);
                    for (let i = 0; i < 9; i++) {
                        let next_it = Math.ceil(it * (i + 1)) - 1;
                        new_res.push(res[next_it])
                    }
                    res = new_res;
                }
                
                res.forEach(function(standing) {
                    let standing_arr = [];

                    let items = Object.keys(standing).map(function(key) {
                        return [key, standing[key]];
                    });
                    items.sort(function(first, second) {
                        return second[1] - first[1];
                    });
                    let standing_so_far = 1;
                    items.forEach(function(team) {
                        if (team[0] !== 'Date') {
                            standing[team[0]] = standing_so_far;
                            standing_so_far++;
                        }
                    });

                    columns.forEach(function(column) {
                        standing_arr.push(standing[column]);
                    });
                    matrix.push(standing_arr);
                });
                this.setState({ posts: matrix, is_loaded: true });
            });
    }

    render() {
        return (
            <div>
                <h2 className='content_header'>Standings</h2>
                <div>
                    <Chart
                        chartType="LineChart"
                        data={this.state.posts}
                        options={this.state.options}
                    />
                    {!this.state.is_loaded && <h4>Loading...</h4>}
                    {this.state.is_loaded && this.state.posts.length === 0 && <h4>No ranking results to show.</h4>}
                </div>
            </div>
        );
    }
}

class PreviousMatch extends Component {
    render() {
        let home_class = 'match_result_team_name team_home ';
        let away_class = 'match_result_team_name ';
        let home_score = this.props.post.FTHG;
        let away_score = this.props.post.FTAG;

        if (home_score > away_score) {
            home_class += 'team_won'
        } else if (home_score < away_score) {
            away_class += 'team_won'
        }

        return (
            <div className='previous_match_container'>
                <span className='match_result'>
                    <span className={home_class}>{this.props.post.HomeTeam}</span>
                    <span className='match_score'>{this.props.post.FTHG} - {this.props.post.FTAG}</span>
                    <span className={away_class}>{this.props.post.AwayTeam}</span>
                </span>
                <span className='match_result_date'>{this.props.post.Date}</span>
            </div>
        );
    }
}

class Results extends Component {
    state = {
        posts: [],
        is_loaded: false
    }

    componentDidMount() {
        axios.get('https://epl-server.herokuapp.com/previous_results')
            .then(response => {
                this.setState({ posts: response.data.reverse(), is_loaded: true });
            });
    }

    render() {
        return (
            <div>
                <h2 className='content_header'>Results</h2>
                {this.state.posts.map((post, key) =>
                    <PreviousMatch key={key} post={post}></PreviousMatch>
                )}
                {!this.state.is_loaded && <h4>Loading...</h4>}
                {this.state.is_loaded && this.state.posts.length === 0 && <h4>There are no more games to show.</h4>}
            </div>
        );
    }
}

class PredictedMatch extends Component {
    constructor(props) {
        super(props);
        this.handleMouseHover = this.handleMouseHover.bind(this);
        this.state = {
            isHovering: false
        };
    }

    handleMouseHover() {
        this.setState({isHovering: !this.state.isHovering});
    }

    render() {
        return (
            <div className='predicted_match_container' onMouseEnter={this.handleMouseHover} onMouseLeave={this.handleMouseHover}>
                <div className='prob_title'>
                    <span className='prob_vs'><b>{this.props.post.HomeTeam}</b> vs <b>{this.props.post.AwayTeam}</b></span>
                    <span className='prob_date'>{this.props.post.Date}</span>
                </div>
                <div className='prob_bar'>
                    <span className='home_prob' style={{'width': this.props.post.prob_H * 100 + '%'}}>
                        <b>{this.state.isHovering ? Math.round(this.props.post.prob_H * 100) + '%': this.props.post.HomeTeam}</b>
                    </span>
                    <span className='draw_prob' style={{'width': this.props.post.prob_D * 100 + '%'}}>
                        <b>{this.state.isHovering ? Math.round(this.props.post.prob_D * 100) + '%' : 'Draw'}</b>
                    </span>
                    <span className='away_prob' style={{'width': this.props.post.prob_A * 100 + '%'}}>
                        <b>{this.state.isHovering ? Math.round(this.props.post.prob_A * 100) + '%': this.props.post.AwayTeam}</b>
                    </span>
                </div>
            </div>
        );
    }
}


class Predictions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            is_loaded: false,
            posts: []
        };
    }

    componentDidMount() {
        axios.get('https://epl-server.herokuapp.com/predictions')
            .then(response => {
                this.setState({ posts: response.data, is_loaded: true });
            });
    }

    render() {
        return (
            <div>
                <h2 className='content_header'>Predictions</h2>
                {this.state.posts.map((post, key) =>
                    <PredictedMatch key={key} post={post}></PredictedMatch>
                )}
                {!this.state.is_loaded && <h4>Loading...</h4>}
                {this.state.is_loaded && this.state.posts.length === 0 && <h4>There are no more games to predict for this season.</h4>}
            </div>
        );
    }
}


class App extends Component {
    state = {
        current_page: null
    }

    handleLinkClick(path) {
        this.setState({current_page: path});
    }

    getLinkClassName(path) {
        return path === this.state.current_page ? 'active_link' : false;
    }

    componentDidMount() {
        const url = window.location.href.split('/');
        this.setState({current_page: url[url.length - 1]});
    }

    render() {
        return (
            <div>
                <Router>
                    <div>
                        <div className='header'>
                            <img className='header_logo' src={logo} alt='logo'></img>
                            <h1>English Premier League Predictor</h1>
                        </div>
                        <div className="navigator">
                            <Link to="/">
                                <span onClick={() => this.handleLinkClick('')} className={'' === this.state.current_page ? 'active_link' : ''}>Home</span>
                            </Link>
                            <Link to="/predictions">
                                <span onClick={() => this.handleLinkClick('predictions')} className={'predictions' === this.state.current_page ? 'active_link' : ''}>Predictions</span>
                            </Link>
                            <Link to="/results">
                                <span onClick={() => this.handleLinkClick('results')} className={'results' === this.state.current_page ? 'active_link' : ''}>Results</span>
                            </Link>
                            <Link to="/standings">
                                <span onClick={() => this.handleLinkClick('standings')} className={'standings' === this.state.current_page ? 'active_link' : ''}>Standings</span>
                            </Link>
                        </div>

                        <div className="content">
                            <Switch>
                                <Route path="/" exact component={Home} />
                                <Route path="/predictions" component={Predictions} />
                                <Route path="/results" component={Results} />
                                <Route path="/standings" component={Standings} />
                            </Switch>
                        </div>
                    </div>
                </Router>
            </div>
        );
    }
}


export default App;



