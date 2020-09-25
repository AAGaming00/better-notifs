const { React } = require('powercord/webpack');
module.exports = class Notification extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
      <div>{this.props.message}</div>
    );
  }
};
