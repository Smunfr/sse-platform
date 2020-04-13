
var baseUrl = 'https://localhost:8888';
var newTabUrl = 'http://localhost';
var loginURL = 'https://localhost:8888/login';
var $modules = $('#modules');
var modulesInstalledList = [];
var userRole = '';
var modulesTemplate =    '' +
       '<li name={{name}}>' +
            '<p><strong>{{name}}</strong></p>' +
            '<button data-id={{name}} class=download>Download</button>' +
            '<button id={{name}} class=uninstall>Uninstall</button>' +
            '<button id={{name}} class=config>Config</button>' +
            '<button id={{name}} class=start>Run</button>' +
            '<button id={{name}} class=stop>Stop</button>' +
          '</li>';
var $body = $('body');


/**
 * on page load - get all available and installed modules
 * add installed modules to list
 */
$(document).ready(function() {
    $.when(getUserRole(), getInstalledModules(),getAvailableModules(), getRunningModules()).done(function(a1, a2, a3, a4){
      if(userRole != "admin"){
        $('.download').hide();
        $('.uninstall').hide();
        $('.config').hide();
        $('.start').hide();
        $('.stop').hide();
      }
    });
});

function getUserRole(){
  $.ajax({
    type: 'GET',
    url: '/roles',
    dataType: 'json',
    success: function (data) {
      userRole = data.role;
    },

    error: function (xhr, status, error) {
      alert('error loading user role');
      console.log(error);
      console.log(status);
      console.log(xhr);
    },
  });
}
/**
 * add or removes class 'loading' on ajax request
 */
$(document).on({
    ajaxStart: function () { $body.addClass('loading');    },

    ajaxStop: function () { $body.removeClass('loading');  },
  });

/**
 * on logout click -  redirect to login page
 *
 */
$('.logout').click(function () {
  console.log('clicked');
  $.ajax({
    type: 'POST',
    url: '/logout',
    success: function (data) {
      window.location.href = loginURL;
    },

    error: function (xhr, status, error) {
      if (xhr.status == 401) {
        window.location.href = loginURL;
      } else {
        alert('error logout');
        console.log(error);
        console.log(status);
        console.log(xhr);
      }
    },
  });
});

/**
 * addModuleInstalled - if Module is installed:
 * add moduleTemplate to HTML and sets the ids and classes with module name
 * add class 'edit'
 * @param  {String} module name of the module
 */
function addModuleInstalled(module) {
  $modules.append(Mustache.render(modulesTemplate, { name: '' + module + '' }));
  var $mod = $('[data-id=' + module + ']');
  var $li = $mod.closest('li');
  $li.addClass('edit');
  $('[data-id=' + module + ']').addClass('noedit');
  $('[id=' + module + ']').addClass('edit');
}

/**
 * addModuleAvailable - if Module is not installed
 * add moduleTemplate to HTML and sets the ids and classes with module name
 * @param  {String} module name of the module
 */
function addModuleAvailable(module) {
  if (modulesInstalledList.indexOf(module) == -1) {
    $modules.append(Mustache.render(modulesTemplate, { name: '' + module + '' }));
    $('[data-id=' + module + ']').addClass('noedit');
    $('[id=' + module + ']').addClass('edit');
  }
}

/**
 * getInstalledModules - on success add modules to List and display HTML
 * calls addModuleInstalled
 */
function getInstalledModules(){
  return $.ajax({
    type: 'GET',
    url: '/modules/list_installed',
    dataType: 'json',
    success: function (modules) {
      $.each(modules.installed_modules, function (i, module) {
        modulesInstalledList.push(module);
        addModuleInstalled(module);
      });
    },

    error: function (xhr, status, error) {
      alert('error loading installed modules');
      console.log(error);
      console.log(status);
      console.log(xhr);
    },
  });
}

/**
 * getRunningModules - display if a module already runs on a port
 * on success display HTML and add running class to elements
 */
function getRunningModules(){
  return $.ajax({
    type: 'GET',
    url: '/execution/running',
    dataType: 'json',
    success: function (data) {

      $.each(data.running_modules, function (i, module) {
        /*
        if(userRole !== 'admin'){
          $modules.append('<li name=' + module.name + '>' +
               '<p><strong>'+ module.name +'</strong></p></li>');
        }*/
        var $li = $body.find('li[name=' + i + ']');
        var $start = $body.find('button#' + i + '.start');
        var $stop = $body.find('button#' + i + '.stop');
        try {
          tailUrl = '';
          //modify URL if its SocialServ
          if(i == 'SocialServ' || i == 'chatsystem') tailUrl = '/main';
          $li.children('p').append('<span id="port"> already running on port <a target="_blank" rel="noopener noreferrer" href=' + newTabUrl + '' + ':' + module.port + tailUrl + '>' + module.port + '</a></span>');
        } catch (e) {
          $li.children('p').append('<span id="port"> already running on a port </span>');
        }

        $start.addClass('running');
        $stop.addClass('running');
      });
    },

    error: function (xhr, status, error) {
      alert('error loading running modules');
      console.log(error);
      console.log(status);
      console.log(xhr);
    },
  });
}
/**
 * getAvailableModules - on success displays html
 * calls addModuleAvailable
 */
function getAvailableModules(){
   return $.ajax({
    type: 'GET',
    url: '/modules/list_available',
    dataType: 'json',
    success: function (modules) {
      if(modules.success == true){
        $.each(modules.modules, function (i, module) {
          addModuleAvailable(module);
        });
      }
      else{
        console.log("error: " + modules.reason);
        alert("Could not connect to Github API");
      }
    },

    error: function (xhr, status, error) {
      if (xhr.status == 401) {
        window.location.href = loginURL;
      } else {
        alert('error loading available modules');
        console.log(error);
        console.log(status);
        console.log(xhr);
      }
    },
  });
}

/**
 * on download click - download module and add it to installed-list
 * add class 'edit'
 */
$modules.delegate('.download', 'click', function () {
    var $li = $(this).closest('li');
    $.ajax({
      type: 'GET',
      url: '/modules/download?module_name=' + $(this).attr('data-id'),
      dataType: 'json',
      success: function (module) {
        if(module.success == true){
          modulesInstalledList.push(module.module);
          $li.addClass('edit');
        }
        else{
          console.log("error: " + module.reason);
          alert("installation failure");
        }
      },

      error: function (xhr, status, error) {
        if (xhr.status == 401) {
          window.location.href = loginURL;
        } else {
          alert('error downloading module');
          console.log(error);
          console.log(status);
          console.log(xhr);
      }
      },
    });
  });

/**
 * on uninstall click - uninstall module and remove it from installed-list
 * removes class 'edit'
 */
$modules.delegate('.uninstall', 'click', function () {
    var $li = $(this).closest('li');
    $.ajax({
      type: 'GET',
      url: '/modules/uninstall?module_name=' + $(this).attr('id'),
      dataType: 'json',
      success: function (module) {
        var index = modulesInstalledList.indexOf(module.module);
        if (index > -1) {
          modulesInstalledList.splice(index, 1);
          $li.removeClass('edit');
        }
      },

      error: function (xhr, status, error) {
        if (xhr.status == 401) {
          window.location.href = loginURL;
        } else {
          alert('error uninstalling module');
          console.log(error);
          console.log(status);
          console.log(xhr);
        }
      },
    });
  });

/**
 * on start click - starts module if its not already running and opens new tab
 * add text to li:paragraph
 * add class 'running' to buttons
 */
$modules.delegate('.start', 'click', function () {
      var $li = $(this).closest('li');
      var $start = $(this);
      var $stop = $('#' + $(this).attr('id') + '.stop');
      $.ajax({
        type: 'GET',
        url: '/execution/start?module_name=' + $(this).attr('id'),
        dataType: 'json',
        success: function (module) {
          console.log('started');
          console.log(module.reason);
          console.log(module.port);

          if (module.reason !== 'already_running') {
            $li.children('p').append('<span id="port"> running on port <a target="_blank" rel="noopener noreferrer" href=' + newTabUrl + '' + ':' + module.port + '>' + module.port + '</a></span>');

            var win = window.open('' + newTabUrl + ':' + module.port + "/main", '_blank');
            if (win) {
              win.focus();
            } else {
              alert('Please allow popups for this page.');
            }

          } /*else {
            try {
              $li.children('p').append('<span id="port"> already running on port <a target="_blank" rel="noopener noreferrer" href=' + newTabUrl + '' + ':' + module.port + '>' + module.port + '</a></span>');
            } catch (e) {
              $li.children('p').append('<span id="port"> already running on a port </span>');
            }
          }*/

          $start.addClass('running');
          $stop.addClass('running');
        },

        error: function (xhr, status, error) {
          if (xhr.status == 401) {
            window.location.href = loginURL;
          } else {
            alert('error starting module');
            console.log(error);
            console.log(status);
            console.log(xhr);
          }
        },
      });
    });

/**
 * on stop click - stops the running module
 * removes id 'port' and class 'running'
 */
$modules.delegate('.stop', 'click', function () {
      var $li = $(this).closest('li');
      var $p = $(this).siblings('p');
      var $stop = $(this);
      var $start = $('#' + $(this).attr('id') + '.start');
      var $port = $p.children('#port');
      $.ajax({
        type: 'GET',
        url: '/execution/stop?module_name=' + $(this).attr('id'),
        dataType: 'json',
        success: function (module) {
          alert('stopped');
          $stop.removeClass('running');
          $start.removeClass('running');
          $port.remove();
        },

        error: function (xhr, status, error) {
          if (xhr.status == 401) {
            window.location.href = loginURL;
          } else {
            alert('error stopping module');
            console.log(error);
            console.log(status);
            console.log(xhr);
          }
        },
      });
    });

/**
 * on config click - loads actual config of modules
 * displays 'bg-modal'
 * add class 'name' to save btn
 * convert config to JSON and display it in textarea
 */
$modules.delegate('.config', 'click', function () {
      var $li = $(this).closest('li');
      $.ajax({
        type: 'GET',
        url: '/configs/view?module_name=' + $li.attr('name'),
        dataType: 'json',
        success: function (module) {
          $('.bg-modal').css('display', 'flex');
          $('#save').addClass($li.attr('name'));
          console.log(module.config);

          //var obj = JSON.parse(module.config);
          var pretty = JSON.stringify(module.config, undefined, 4);
          $('#config-area').val(pretty);
        },

        error: function (xhr, status, error) {
          if (xhr.status == 401) {
            window.location.href = loginURL;
          } else {
            alert('error loading config of module');
            console.log(error);
            console.log(status);
            console.log(xhr);
          }
        },
      });
    });

/**
 * on close click - resets textarea and display of bg-modal
 */
$body.delegate('.close', 'click', function () {
      $('.bg-modal').css('display', 'none');
      $('#config-area').val('');
    });

/**
 * on save click - saves content of textarea as JSON to config of module
 * resets textarea and display of bg-modal
 */
$body.delegate('#save', 'click', function () {

      try {
        prettyPrint();
      } catch (e) {
        alert('Config needs to be JSON.');
        return;
      }

      config = $('#config-area').val();
      console.log(config);
      $.ajax({
        type: 'POST',
        url: '/configs/update?module_name=' + $(this).attr('class'),
        data: config,
        success: function (module) {
          console.log(module);
          $('.bg-modal').css('display', 'none');
          $('#config-area').val('');
        },

        error: function (xhr, status, error) {
          if (xhr.status == 401) {
            window.location.href = loginURL;
          } else {
            alert('error saving config of module, check syntax');
            console.log(error);
            console.log(status);
            console.log(xhr);
          }
        },
      });
    });

/**
 * prettyPrint - prints the text of 'config-area' pretty
 */
function prettyPrint() {
  var $ugly = $('#config-area').val();
  var obj = JSON.parse($ugly);
  var pretty = JSON.stringify(obj, undefined, 4);
  $('#config-area').val(pretty);

}
