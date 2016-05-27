window.inject = function (serviceName) {
  var service =  angular.element(document.body).injector().get(serviceName);
  window[serviceName] = service;
  return service;
};

window.bc = {}
window.buttonClicker = window.bc

bc.getGithubOrgId = function (name) {
  inject('$http');
  inject('configAPIHost');
  return $http({
    method: 'get',
    url: configAPIHost + '/github/orgs/' + name
  })
    .then(function (res) {
      return res.data;
    });
};


bc.deleteAllInvitations = function () {
  inject('fetchUser');
  inject('promisify');
  inject('fetchGithubOrgId');
  inject('$state');
  inject('$q');
  return fetchUser()
    .then(function (user) {
        return $q.when(fetchGithubOrgId($state.params.userName))
          .then(function (id) {
            return promisify(user, 'fetchTeammateInvitations')({ 
              orgGithubId: id
            })
          })
          .then(function (invitations) {
            return $q.all(invitations.map(function (invite) {
               return promisify(user, 'destroyTeammateInvitation')(invite.id())
                  .then(() => console.log('Success'))
                  .catch(() => console.log('Failure'))
            }));
          });
  });
};

bc.whiteListOrg = function (orgName) {
  inject('configAPIHost');
  inject('$http');
  return $http({
      url: configAPIHost + '/auth/whitelist',
      method: "POST",
      data: { 'name' : orgName }
  })
    .then(function (data) {
        console.log(data);
    });
};

bc.deWhiteListOrg = function (orgName) {
  inject('configAPIHost');
  inject('$http');
  return $http({
      url: configAPIHost + '/auth/whitelist/' + orgName,
      method: "DELETE"
  })
    .then(function (data) {
        console.log(data);
    });
};

const flts = {
  running: (i) => i.status() === 'running',

  crashed: (i) => i.status() === 'crashed',
  buidlFailed: (i) => i.status() === 'buildFailed',
  neverStarted: (i) => i.status() === 'neverStarted',
  red: (i) => (flts.crashed(i) || flts.buildFailed(i) || flts.neverStarted(i)),

  building: (i) => i.status() === 'building',
  stopping: (i) => i.status() === 'stopping',
  migrating: (i) => i.isMigrating(),
  yellow: (i) => (flts.building(i) || flts.stopping(i) || flts.migrating(i)),

  stopped: (i) => i.status() === 'stopped'
}
bc.filters = flts

bc.getAllInstances = function (filterFunc) {
  inject('fetchUser')
  inject('$rootScope')
  inject('promisify')
  return fetchUser()
  .then((user) => {
      var name = $rootScope.dataApp.data.activeAccount.oauthName();
      return promisify(user, 'fetchInstances')({
          githubUsername: name
      })
      .then((instances) => {
        if (typeof filterFunc !== 'function') {
          return instances
        }
        return instances.filter(filterFunc)
      })
  })
}

bc.getInstancesByRepoAndBranchName = function (repoName, branchName) {
  inject('keypather')
  if (typeof repoName !== 'string') {
      throw new Error('`repoName` is required');
  }
  return bc.getAllInstances()
      .then((instances) => {
          return instances.filter((i) => {
              var acv = keypather.get(i, 'attrs.contextVersion.appCodeVersions[0]');
              if (!acv) return false;
              if (!branchName) return acv.lowerRepo.includes(repoName);
              return (
                  acv.branch === branchName &&
                  acv.lowerRepo.includes(repoName)
              )
          })
      })
};

bc.getAllInstancesAndGroupByDockerHost = function () {
  inject('keypather')
  var group = {}
  return bc.getAllInstances()
      .then((instances) => {
          instances.forEach((i) => {
              var host = keypather.get(i,'attrs.container.dockerHost')
              if (!group[host]) {
                  group[host] = []
              }
              group[host].push(i)
          })
          return group
      })
}

bc.getAllInstancesAndGroupByStatus = function () {
  var group = {}
  return bc.getAllInstances()
      .then((instances) => {
          instances.forEach((i) => {
              var s = i.status()
              if (!group[s]) {
                  group[s] = []
              }
              group[s].push(i)
          })
          return group
      })
}

bc.deleteInstances = function (repoName, branchName) {
  inject('promisify')
  inject('$q')
  bc.getInstancesByRepoAndBranchName(repoName, branchName)
      .then((instances) => {
          return $q.all(
              instances.map((i) => promisify(i, 'destroy')())
          );
      })
}

bc.loginAsUser = function (accessToken) {
  inject('$http')
  inject('configAPIHost');
  console.log('configAPIHost', configAPIHost);
  return $http.post(
      configAPIHost + '/auth/github/token',
      {accessToken: accessToken }
  );
}

bc.printAllInstancesAndGroupByDockerHost = function () {
  bc.getAllInstancesAndGroupByDockerHost()
      .then(function (group) {
          var res = []
          Object.keys(group).forEach((hostName) => {
              var str = "Host: " + hostName.replace('http://', '').replace(':4242', '')
              str += " (" + group[hostName].length + ")"
              str += group[hostName].map((i) => {
                  return ' / ' + i.attrs.name 
              }).join(' ')
              res.push(str)
          })
          console.log(res.join('\n'))
      })
}

bc.printAllInstancesAndGroupByStatus = function () {
  bc.getAllInstancesAndGroupByStatus()
      .then(function (group) {
          var res = []
          Object.keys(group).forEach((s) => {
              var str = "Status: " + s
              str += " (" + group[s].length + ")"
              res.push(str)
          })
          console.log(res.join('\n'))
      })
}

bc.rebuildAllInstances = function (filterFunc) {
  inject('promisify')
  inject('createBuildFromContextVersionId')
  return bc.getAllInstances(filterFunc)
      .then((is) => {
        console.log('Instances Found:' is.length)
        is.forEach((i) => {
          return promisify(i.build, 'deepCopy')()
              .then((newBuild) => {
                return promisify(newBuild, 'build')({ message: 'Manual Build', noCache: true })
              })
              .then((newBuild) => {
                return promisify(i, 'update')({ build: newBuild.id() })
              })
              .then(() => console.log('Success', i.attrs.name))
              .catch((err) => console.log('Fail', i.attrs.name, err))
        })
    })
}

bc.getCurrentUserId = function () {
  inject('$rootScope')
  return $rootScope.dataApp.data.orgs.models[0].attrs.id
};
