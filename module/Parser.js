const request = require("request");
const fs = require("fs");

class Parser {
  constructor() {
    this.URL = undefined;
    this.API = undefined;
    this.currentSeason = undefined;
    this.currentEpisode = undefined;
    this.downloadURLList = [];
  }
  async __initialize() {
    this.__getAPI();
    await this.__getDownloadURLList();
    await this.__createDirectory();

    console.log(`Start Downloading Season: ${this.currentSeason + 1} Episode: ${this.currentEpisode + 1}`)

    this.__fetch();
  }
  __getAPI() {
    this.API = `https://api.imovies.cc/api/v1/movies/${this.URL.split("/")[5]}/season-files/`;
  }
  __getDownloadURLList() {
    return new Promise((resolve, reject) => {
      request.get(this.API + this.currentSeason, {json: true}, (err, res, body) => {
        if (err) {
          console.error(err);
          reject();
        }

        for (const prop of body.data) {
          this.downloadURLList.push({title: prop.title, url: prop.files[0].files[0].src});
        }

        resolve();
      });
    });
  }
  __createDirectory() {
    return new Promise((resolve, reject) => {
      fs.mkdir("./series", (err) => {
        if (err && err.errno !== -4075) console.error(err);

        fs.mkdir("./series/" + (this.currentSeason + 1), (_err) => {
          if (_err && _err.errno !== -4075) console.error(_err);

          resolve();
        });
      })
    })
  }
  __fetch() {
    if (this.currentEpisode > this.downloadURLList.length - 1) {
      console.log("Download Complete");
    }

    request.get(this.downloadURLList[this.currentEpisode].url)
      .on("error", (err) => console.error(err))
      .on("response", () => console.log(`Episode ${this.currentEpisode + 1} Downloading...`))
      .pipe(fs.createWriteStream(`series/${this.currentSeason + 1}/${this.downloadURLList[this.currentEpisode].title}.mp4`))
      .on("finish", () => {
        console.log(`Episode ${this.currentEpisode + 1} Downloaded`);

        this.currentEpisode++;

        this.__fetch();
      })
  }

  Download(url, season = 0, fromEpisode = 0) {
    if (season !== 0) {
      season--;
    }
    if (fromEpisode !== 0) {
      fromEpisode--;
    }

    this.URL = url;
    this.currentSeason = season;
    this.currentEpisode = fromEpisode;

    this.__initialize();
  }
}

module.exports = new Parser();
