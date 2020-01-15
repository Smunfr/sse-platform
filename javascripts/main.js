
var baseUrl = 'http://localhost:8888';
var newTabUrl = 'http://localhost';
var $modules = $('#modules');
var modulesInstalledList = [];
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
 * add or removes class 'loading' on ajax request
 */
$(document).on({
    ajaxStart: function () { $body.addClass('loading');    },

    ajaxStop: function () { $body.removeClass('loading');  },
  });

/**
 * addModuleInstalled - if Module is installed:
 * add moduleTemplate to HTML and sets the ids and classes with module name
 * add class 'edit'
 * @param  {None} module name of the module
 * @return {None}        None
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
 * @param  {None} module name of the module
 * @return {None}        None
 */
function addModuleAvailable(module) {
  if (modulesInstalledList.indexOf(module) == -1) {
    $modules.append(Mustache.render(modulesTemplate, { name: '' + module + '' }));
    $('[data-id=' + module + ']').addClass('noedit');
    $('[id=' + module + ']').addClass('edit');

    //get element with module id and start class
    //$('#' + module + '.start').addClass('running');
  }
}

/**
 * on page load - get all available and installed modules
 * add installed modules to list
 * @return {None}  None
 */
$(function () {
      $.ajax({
        type: 'GET',
        url: baseUrl + '/modules/list_installed',
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

      $.ajax({
        type: 'GET',
        url: baseUrl + '/modules/list_available',
        dataType: 'json',
        success: function (modules) {
          $.each(modules.modules, function (i, module) {
            addModuleAvailable(module);
          });
        },

        error: function (xhr, status, error) {
          alert('error loading available modules');
          console.log(error);
          console.log(status);
          console.log(xhr);
        },
      });
    });

/**
 * on download click - download module and add it to installed-list
 * add class 'edit'
 * @return {None}  None
 */
$modules.delegate('.download', 'click', function () {
    var $li = $(this).closest('li');
    $.ajax({
      type: 'GET',
      url: baseUrl + '/modules/download?module_name=' + $(this).attr('data-id'),
      dataType: 'json',
      success: function (module) {
        modulesInstalledList.push(module.module);
        $li.addClass('edit');
      },

      error: function (xhr, status, error) {
        alert('error downloading module');
        console.log(error);
        console.log(status);
        console.log(xhr);
      },
    });
  });

/**
 * on uninstall click - uninstall module and remove it from installed-list
 * removes class 'edit'
 * @return {None}  None
 */
$modules.delegate('.uninstall', 'click', function () {
    var $li = $(this).closest('li');
    $.ajax({
      type: 'GET',
      url: baseUrl + '/modules/uninstall?module_name=' + $(this).attr('id'),
      dataType: 'json',
      success: function (module) {
        var index = modulesInstalledList.indexOf(module.module);
        if (index > -1) {
          modulesInstalledList.splice(index, 1);
          $li.removeClass('edit');
        }

      },

      error: function (xhr, status, error) {
        alert('error uninstalling module');
        console.log(error);
        console.log(status);
        console.log(xhr);
      },
    });
  });

/**
 * on start click - starts module if its not already running and opens new tab
 * add text to li:paragraph
 * add class 'running' to buttons
 * @return {None}  None
 */
$modules.delegate('.start', 'click', function () {
      var $li = $(this).closest('li');
      var $start = $(this);
      var $stop = $('#' + $(this).attr('id') + '.stop');
      $.ajax({
        type: 'GET',
        url: baseUrl + '/execution/start?module_name=' + $(this).attr('id'),
        dataType: 'json',
        success: function (module) {
          console.log('started');
          console.log(module.reason);
          console.log(module.port);

          if (module.reason !== 'already_running') {
            $li.children('p').append('<span id="port"> running on port ' + module.port + '</span>');

            var win = window.open('' + newTabUrl + ':' + module.port, '_blank');
            if (win) {
              win.focus();
            } else {
              alert('Please allow popups for this page.');
            }

          } else {
            $li.children('p').append('<span id="port"> already running on a port </span>');
          }

          $start.addClass('running');
          $stop.addClass('running');
        },

        error: function (xhr, status, error) {
          alert('error starting module');
          console.log(error);
          console.log(status);
          console.log(xhr);
        },
      });
    });

/**
 * on stop click - stops the running module
 * removes id 'port' and class 'running'
 * @return {None}  None
 */
$modules.delegate('.stop', 'click', function () {
      var $stop = $(this);
      var $start = $('#' + $(this).attr('id') + '.start');
      var $port = $('#port');

      // if ajax works this can be removed
      $(this).removeClass('running');
      $('#' + $(this).attr('id') + '.start').removeClass('running');
      $('#port').remove();
      $.ajax({
        type: 'GET',
        url: baseUrl + '/execution/stop?module_name=' + $(this).attr('id'),
        dataType: 'json',
        success: function (module) {
          alert('stopped');
          $stop.removeClass('running');
          $start.removeClass('running');
          $port.remove();
        },

        error: function (xhr, status, error) {
          alert('error stopping module');
          console.log(error);
          console.log(status);
          console.log(xhr);
        },
      });
    });

/**
 * on config click - loads actual config of modules
 * displays 'bg-modal'
 * add class 'name' to save btn
 * convert config to JSON and display it in textarea
 *
 * @return {None}  None
 */
$modules.delegate('.config', 'click', function () {
      var $li = $(this).closest('li');
      $.ajax({
        type: 'GET',
        url: baseUrl + '/configs/view?module_name=' + $li.attr('name'),
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
          alert('error loading config of module');
          console.log(error);
          console.log(status);
          console.log(xhr);
        },
      });
    });

/**
 * on close click - resets textarea and display of bg-modal
 *
 * @return {None}  None
 */
$body.delegate('.close', 'click', function () {
      $('.bg-modal').css('display', 'none');
      $('#config-area').val('');
    });

/**
 * on save click - saves content of textarea as JSON to config of module
 * resets textarea and display of bg-modal
 *
 * @return {None}  None
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
        url: baseUrl + '/configs/update?module_name=' + $(this).attr('class'),
        data: config,
        success: function (module) {
          console.log(module);
          $('.bg-modal').css('display', 'none');
          $('#config-area').val('');
        },

        error: function (xhr, status, error) {
          alert('error saving config of module, check syntax');
          console.log(error);
          console.log(status);
          console.log(xhr);
        },
      });
    });

/**
 * prettyPrint - prints the text of 'config-area' pretty
 *
 * @return {None}  None
 */
function prettyPrint() {
  var $ugly = $('#config-area').val();
  var obj = JSON.parse($ugly);
  var pretty = JSON.stringify(obj, undefined, 4);
  $('#config-area').val(pretty);

}
