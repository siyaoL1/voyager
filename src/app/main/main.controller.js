'use strict';

angular.module('voyager2')
  .controller('MainCtrl', function($scope, $document, Spec, Dataset, Wildcards, Config, consts, Chronicle, Logger, Bookmarks, Modals) {
    $scope.Spec = Spec;
    $scope.Dataset = Dataset;
    $scope.Wildcards = Wildcards;
    $scope.Config = Config;
    $scope.Bookmarks = Bookmarks;
    $scope.consts = consts;
    $scope.showDevPanel = false;
    $scope.embedded = !!consts.embeddedData;

    $scope.hideExplore = false;
    $scope.toggleHideExplore = function() {
      $scope.hideExplore = !$scope.hideExplore;
    };

    $scope.alternativeType = null;
    $scope.setAlternativeType = function(type) {
      $scope.alternativeType = type;
    };

    $scope.scrollToTop = function() {
      $document.find('.vis-pane-container').scrollTop(0);
    };

    $scope.$watch('Spec.alternatives', function(alternatives) {
      for (var i = 0 ; i < alternatives.length; i++) {
        if ($scope.alternativeType === alternatives[i].type) {
          return;
        }
      }
      // at this point we don't have the suggestion type available, thus reset
      $scope.setAlternativeType(null);
    });

    // undo/redo support
    $scope.canUndo = false;
    $scope.canRedo = false;

    // bookmark
    $scope.showModal = function(modalId) {
      Modals.open(modalId);
    };

    if (Bookmarks.isSupported) {
      // load bookmarks from local storage
      Bookmarks.load();
    }

    if ($scope.embedded) {
      // use provided data and we will hide the dataset selector
      Dataset.dataset = {
        values: consts.embeddedData,
        name: 'embedded'
      };
    }

    // initialize undo after we have a dataset
    Dataset.update(Dataset.dataset).then(function() {
      Config.updateDataset(Dataset.dataset);

      if (consts.initialSpec) {
          Spec.parseSpec(consts.initialSpec);
      }

      $scope.chron = Chronicle.record('Spec.spec', $scope, true,
        ['Dataset.dataset', 'Dataset.schema', 'Config.config']);

      $scope.canUndoRedo = function() {
        $scope.canUndo = $scope.chron.canUndo();
        $scope.canRedo = $scope.chron.canRedo();
      };
      $scope.chron.addOnAdjustFunction($scope.canUndoRedo);
      $scope.chron.addOnUndoFunction($scope.canUndoRedo);
      $scope.chron.addOnRedoFunction($scope.canUndoRedo);

      $scope.chron.addOnUndoFunction(function() {
        Logger.logInteraction(Logger.actions.UNDO);
      });
      $scope.chron.addOnRedoFunction(function() {
        Logger.logInteraction(Logger.actions.REDO);
      });

      angular.element($document).on('keydown', function(e) {
        if (e.keyCode === 'Z'.charCodeAt(0) && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
          $scope.chron.undo();
          $scope.$digest();
          return false;
        } else if (e.keyCode === 'Y'.charCodeAt(0) && (e.ctrlKey || e.metaKey)) {
          $scope.chron.redo();
          $scope.$digest();
          return false;
        } else if (e.keyCode === 'Z'.charCodeAt(0) && (e.ctrlKey || e.metaKey) && e.shiftKey) {
          $scope.chron.redo();
          $scope.$digest();
          return false;
        }
      });
    });
  });
