window.inject = function (serviceName) {
  var service =  angular.element(document.body).injector().get(serviceName);
  window[serviceName] = service;
  return service;
};

window.buttonClicker = {}
window.bc = window.buttonClicker

buttonClicker.getGithubOrgId = function (name) {
  inject('$http');
  inject('configAPIHost');
  return $http({
    method: 'get',
    url: configAPIHost + '/github/orgs/' + name
  })
    .then(function (res) {
      console.log('Id', res.data.id);
      return res.data;
    });
};


buttonClicker.deleteAllInvitations = function () {
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
               console.log(invite.id());
               return promisify(user, 'destroyTeammateInvitation')(invite.id())
                  .then(() => console.log('Success'))
                  .catch(() => console.log('Failure'))
            }));
          });
  });
};

buttonClicker.whiteListOrg = function (orgName) {
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

buttonClicker.deWhiteListOrg = function (orgName) {
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

buttonClicker.getAllInstances = function () {
  inject('fetchUser')
  inject('$rootScope')
  inject('promisify')
  return fetchUser()
  .then((user) => {
      var name = $rootScope.dataApp.data.activeAccount.oauthName();
      return promisify(user, 'fetchInstances')({
          githubUsername: name
      })
  })
}

buttonClicker.getInstancesByRepoAndBranchName = function (repoName, branchName) {
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

buttonClicker.getAllInstancesAndGroupByDockerHost = function () {
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

buttonClicker.getAllInstancesAndGroupByStatus = function () {
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

buttonClicker.deleteInstances = function (repoName, branchName) {
  inject('promisify')
  inject('$q')
  bc.getInstancesByRepoAndBranchName(repoName, branchName)
      .then((instances) => {
          return $q.all(
              instances.map((i) => promisify(i, 'destroy')())
          );
      })
}

buttonClicker.loginAsUser = function (accessToken) {
  inject('$http')
  inject('configAPIHost');
  console.log('configAPIHost', configAPIHost);
  return $http.post(
      configAPIHost + '/auth/github/token',
      {accessToken: accessToken }
  );
}

buttonClicker.printAllInstancesAndGroupByDockerHost = function () {
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

buttonClicker.printAllInstancesAndGroupByStatus = function () {
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

buttonClicker.rebuildAllInstances = function () {
  console.log('rebuildAllInstances not yet implemented')
  // inject('promisify')
  // inject('createBuildFromContextVersionId')
  // return getAllInstances()
      // .then((is) => {
          // is.forEach((i) => {
              // return createBuildFromContextVersionId(i.attrs.contextVersion._id)
                  // .then((build) => {
                      // return promisify(build, 'build')({
                         // message: 'manual',
                        // noCache: true
                      // })
                  // })
                  // .then(() => console.log('Success', i.attrs.name))
                  // .catch((err) => console.log('Fail', i.attrs.name, err))
          // })
      // })
}

buttonClicker.getCurrentUserId = function () {
  inject('$rootScope')
  return $rootScope.dataApp.data.orgs.models[0].attrs.id
};
