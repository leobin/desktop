'use strict';

const fs = require('fs');

const env = require('../../modules/environment');

describe('browser/settings.html', function desc() {
  this.timeout(10000);

  const config = {
    version: 1,
    teams: [{
      name: 'example_1',
      url: env.mattermostURL
    }, {
      name: 'example_2',
      url: env.mattermostURL
    }]
  };

  beforeEach(() => {
    fs.writeFileSync(env.configFilePath, JSON.stringify(config));
    this.app = env.getSpectronApp();
    return this.app.start();
  });

  afterEach(() => {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
    return true;
  });

  it('should show index.html when Close button is clicked', () => {
    env.addClientCommands(this.app.client);
    return this.app.client.
      loadSettingsPage().
      click('#btnClose').
      pause(1000).
      getUrl().should.eventually.match(/\/index.html(\?.+)?$/);
  });

  it('should show NewServerModal after all servers are removed', () => {
    const modalTitleSelector = '.modal-title=Remove Server';
    env.addClientCommands(this.app.client);
    return this.app.client.
      loadSettingsPage().
      click('=Remove').
      waitForVisible(modalTitleSelector).
      element('.modal-dialog').click('.btn=Remove').
      pause(500).
      click('=Remove').
      waitForVisible(modalTitleSelector).
      element('.modal-dialog').click('.btn=Remove').
      pause(500).
      isExisting('#newServerModal').should.eventually.equal(true);
  });

  describe('Server list', () => {
    it('should open the corresponding tab when a server list item is clicked', () => {
      env.addClientCommands(this.app.client);
      return this.app.client.
      loadSettingsPage().
      click('h4=example_1').
      pause(100).
      waitUntilWindowLoaded().
      getUrl().should.eventually.match(/\/index.html(\?.+)?$/).
      isVisible('#mattermostView0').should.eventually.be.true.
      isVisible('#mattermostView1').should.eventually.be.false.

      loadSettingsPage().
      click('h4=example_2').
      pause(100).
      waitUntilWindowLoaded().
      getUrl().should.eventually.match(/\/index.html(\?.+)?$/).
      isVisible('#mattermostView0').should.eventually.be.false.
      isVisible('#mattermostView1').should.eventually.be.true;
    });
  });

  describe('Options', () => {
    describe.skip('Hide Menu Bar', () => {
      it('should appear on win32 or linux', () => {
        const expected = (process.platform === 'win32' || process.platform === 'linux');
        env.addClientCommands(this.app.client);
        return this.app.client.
        loadSettingsPage().
        isExisting('#inputHideMenuBar').should.eventually.equal(expected);
      });

      [true, false].forEach((v) => {
        env.shouldTest(it, env.isOneOf(['win32', 'linux']))(`should be saved and loaded: ${v}`, () => {
          env.addClientCommands(this.app.client);
          return this.app.client.
            loadSettingsPage().
            scroll('#inputHideMenuBar').
            isSelected('#inputHideMenuBar').then((isSelected) => {
              if (isSelected !== v) {
                return this.app.client.click('#inputHideMenuBar');
              }
              return true;
            }).
            pause(600).
            click('#btnClose').
            pause(1000).then(() => {
              const savedConfig = JSON.parse(fs.readFileSync(env.configFilePath, 'utf8'));
              savedConfig.hideMenuBar.should.equal(v);
            }).
            browserWindow.isMenuBarAutoHide().should.eventually.equal(v).then(() => { // confirm actual behavior
              return this.app.restart();
            }).then(() => {
              env.addClientCommands(this.app.client);
              return this.app.client. // confirm actual behavior
                browserWindow.isMenuBarAutoHide().should.eventually.equal(v).
                loadSettingsPage().
                isSelected('#inputHideMenuBar').should.eventually.equal(v);
            });
        });
      });
    });

    describe('Display secure content only', () => {
      [true, false].forEach((v) => {
        it(`should be saved and loaded: ${v}`, () => {
          const webPreferences = v ? '' : 'allowDisplayingInsecureContent';
          env.addClientCommands(this.app.client);

          return this.app.client.
            loadSettingsPage().
            scroll('#inputDisableWebSecurity').
            isSelected('#inputDisableWebSecurity').then((isSelected) => {
              if (isSelected !== v) {
                return this.app.client.click('#inputDisableWebSecurity');
              }
              return true;
            }).
            pause(600).
            click('#btnClose').
            pause(1000).then(() => {
              const savedConfig = JSON.parse(fs.readFileSync(env.configFilePath, 'utf8'));
              savedConfig.disablewebsecurity.should.equal(!v);
            }).
            getAttribute('.mattermostView', 'webpreferences').then((disablewebsecurity) => { // confirm actual behavior
              // disablewebsecurity is an array of String
              disablewebsecurity.forEach((d) => {
                d.should.equal(webPreferences);
              });
            }).then(() => {
              return this.app.restart();
            }).then(() => {
              env.addClientCommands(this.app.client);
              return this.app.client. // confirm actual behavior
                getAttribute('.mattermostView', 'webpreferences').then((disablewebsecurity) => { // disablewebsecurity is an array of String
                  disablewebsecurity.forEach((d) => {
                    d.should.equal(webPreferences);
                  });
                }).
                loadSettingsPage().
                isSelected('#inputDisableWebSecurity').should.eventually.equal(v);
            });
        });
      });
    });

    describe('Start app on login', () => {
      it('should appear on win32 or linux', () => {
        const expected = (process.platform === 'win32' || process.platform === 'linux');
        env.addClientCommands(this.app.client);
        return this.app.client.
          loadSettingsPage().
          isExisting('#inputAutoStart').should.eventually.equal(expected);
      });
    });

    describe('Show icon in menu bar / notification area', () => {
      it('should appear on darwin or linux', () => {
        const expected = (process.platform === 'darwin' || process.platform === 'linux');
        env.addClientCommands(this.app.client);
        return this.app.client.
          loadSettingsPage().
          isExisting('#inputShowTrayIcon').should.eventually.equal(expected);
      });
    });

    describe('Leave app running in notification area when application window is closed', () => {
      it('should appear on linux', () => {
        const expected = (process.platform === 'linux');
        env.addClientCommands(this.app.client);
        return this.app.client.
          loadSettingsPage().
          isExisting('#inputMinimizeToTray').should.eventually.equal(expected);
      });
    });

    describe.skip('Toggle window visibility when clicking on the tray icon', () => {
      it('should appear on win32', () => {
        const expected = (process.platform === 'win32');
        env.addClientCommands(this.app.client);
        return this.app.client.
          loadSettingsPage().
          isExisting('#inputToggleWindowOnTrayIconClick').should.eventually.equal(expected);
      });
    });

    describe('Flash app window and taskbar icon when a new message is received', () => {
      it('should appear on win32 and linux', () => {
        const expected = (process.platform === 'win32' || process.platform === 'linux');
        env.addClientCommands(this.app.client);
        return this.app.client.
          loadSettingsPage().
          isExisting('#inputflashWindow').should.eventually.equal(expected);
      });
    });

    describe('Show red badge on taskbar icon to indicate unread messages', () => {
      it('should appear on darwin or win32', () => {
        const expected = (process.platform === 'darwin' || process.platform === 'win32');
        env.addClientCommands(this.app.client);
        return this.app.client.
          loadSettingsPage().
          isExisting('#inputShowUnreadBadge').should.eventually.equal(expected);
      });
    });
  });

  describe('RemoveServerModal', () => {
    const modalTitleSelector = '.modal-title=Remove Server';

    beforeEach(() => {
      env.addClientCommands(this.app.client);
      return this.app.client.
        loadSettingsPage().
        isExisting(modalTitleSelector).should.eventually.false.
        isVisible(modalTitleSelector).should.eventually.false.
        click('=Remove').
        waitForVisible(modalTitleSelector);
    });

    it('should remove existing team on click Remove', (done) => {
      this.app.client.
        element('.modal-dialog').click('.btn=Remove').
        pause(500).
        isExisting(modalTitleSelector).should.eventually.false.
        click('#btnClose').
        pause(500).then(() => {
          const savedConfig = JSON.parse(fs.readFileSync(env.configFilePath, 'utf8'));
          savedConfig.teams.should.deep.equal(config.teams.slice(1));
          done();
        });
    });

    it('should NOT remove existing team on click Cancel', (done) => {
      this.app.client.
        element('.modal-dialog').click('.btn=Cancel').
        pause(500).
        isExisting(modalTitleSelector).should.eventually.false.
        click('#btnClose').
        pause(500).then(() => {
          const savedConfig = JSON.parse(fs.readFileSync(env.configFilePath, 'utf8'));
          savedConfig.teams.should.deep.equal(config.teams);
          done();
        });
    });

    it('should disappear on click Close', () => {
      return this.app.client.
        click('.modal-dialog button.close').
        pause(500).
        isExisting(modalTitleSelector).should.eventually.false;
    });

    it('should disappear on click background', () => {
      return this.app.client.
        click('body').
        pause(500).
        isExisting(modalTitleSelector).should.eventually.false;
    });
  });

  describe('NewTeamModal', () => {
    beforeEach(() => {
      env.addClientCommands(this.app.client);
      return this.app.client.
        loadSettingsPage().
        click('#addNewServer');
    });

    it('should open the new server modal', () => {
      return this.app.client.isExisting('#newServerModal').should.eventually.equal(true);
    });

    it('should close the window after clicking cancel', () => {
      return this.app.client.
        click('#cancelNewServerModal').
        pause(1000). // Animation
        isExisting('#newServerModal').should.eventually.equal(false);
    });

    it('should not be valid if no team name has been set', () => {
      return this.app.client.
        click('#saveNewServerModal').
        pause(500).
        isExisting('.has-error #teamNameInput').should.eventually.equal(true);
    });

    it('should not be valid if no server address has been set', () => {
      return this.app.client.
        click('#saveNewServerModal').
        pause(500).
        isExisting('.has-error #teamUrlInput').should.eventually.equal(true);
    });

    describe('Valid server name', () => {
      beforeEach(() => {
        return this.app.client.
            setValue('#teamNameInput', 'TestTeam').
            click('#saveNewServerModal');
      });

      it('should not be marked invalid', () => {
        return this.app.client.
            isExisting('.has-error #teamNameInput').should.eventually.equal(false);
      });

      it('should not be possible to click save', () => {
        return this.app.client.
          getAttribute('#saveNewServerModal', 'disabled').should.eventually.equal('true');
      });
    });

    describe('Valid server url', () => {
      beforeEach(() => {
        return this.app.client.
            setValue('#teamUrlInput', 'http://example.org').
            click('#saveNewServerModal');
      });

      it('should be valid', () => {
        return this.app.client.
          isExisting('.has-error #teamUrlInput').should.eventually.equal(false);
      });

      it('should not be possible to click save', () => {
        return this.app.client.
          getAttribute('#saveNewServerModal', 'disabled').should.eventually.equal('true');
      });
    });

    it('should not be valid if an invalid server address has been set', () => {
      return this.app.client.
        setValue('#teamUrlInput', 'superInvalid url').
        click('#saveNewServerModal').
        pause(500).
        isExisting('.has-error #teamUrlInput').should.eventually.equal(true);
    });

    describe('Valid Team Settings', () => {
      beforeEach(() => {
        return this.app.client.
            setValue('#teamUrlInput', 'http://example.org').
            setValue('#teamNameInput', 'TestTeam');
      });

      it('should be possible to click add', () => {
        return this.app.client.
          getAttribute('#saveNewServerModal', 'disabled').should.eventually.equal(null);
      });

      it('should add the team to the config file', (done) => {
        this.app.client.
          click('#saveNewServerModal').
          pause(1000). // Animation
          click('#btnClose').
          pause(1000).then(() => {
            const savedConfig = JSON.parse(fs.readFileSync(env.configFilePath, 'utf8'));
            savedConfig.teams.should.contain({
              name: 'TestTeam',
              url: 'http://example.org'
            });
            return done();
          });
      });
    });
  });
});
