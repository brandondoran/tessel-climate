# tessel-climate

Program for the [Tessel 1](https://tessel.io/) board to periodically gather temperature and humidty readings from climate module and send to [Keen.io](https://keen.io/).

## Installation

    $ git clone https://github.com/brandondoran/tessel-climate.git
    $ cd tessel-climate
    $ npm install
    
## Configuration

Copy the example config file to config.json:

    $ cp config.example config.json
    
* Set the `wifi` properties according to your network.
* Set set the following `keen` properties:
  * `projectId` keen.io project ID
  * `writeKey` master key for the project
  * `collection` name of the event collection
    
## Running

Connect the Tessel to a USB port and run temporarily (not from flash):

    $ npm start
    
Or use the tessel run command explicity:

    $ tessel run index.js
    
See [Tessel cli docs](https://tessel.io/docs/cli#commands) for more details.

### Filename Size Limit

Nested dependencies in the node_modules may hit the Tessel's file size limit, resulting in the following error message when the program starts up:
 
    Error parsing tar file: -2
    NOTE: Tessel archive expansion does not yet support long file paths.
    You might temporarily resolve the problem by consolidating your
    node_modules folders into a flat, not nested, hierarchy.

A possible workaround is to install production packages only:

    $ rm -rf node_modules
    $ npm install --production
    
And simplify the package tree:

    $ npm dedupe
    
## A Note on Wifi and SSL
The Tessel 1 wifi chip can be flaky. I've found it works much better when not using SSL. To accomplish this, overide `urlBase` in `config.json`:

    "urlBase": "http://api.keen.io"
    
## License
[MIT](https://github.com/brandondoran/tessel-climate/blob/master/LICENSE)
