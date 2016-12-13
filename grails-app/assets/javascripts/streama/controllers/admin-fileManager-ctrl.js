

angular.module('streama').controller('adminFileManagerCtrl', ['$scope', 'apiService', 'modalService', '$state', function ($scope, apiService, modalService, $state) {


	$scope.maxPerPage = 10;
	$scope.offset = 0;
	$scope.pagination = {};

	$scope.activeListDisplay = 'table';

	$scope.deletionBulk = [];

	$scope.changeListDisplay = function (displayType) {
		$scope.activeListDisplay = displayType;
	};

	$scope.removeFile = function(file){
		var confirmText;
		if(file.isHardDriveFile){
			confirmText = 'This file is not associated with any object in the database and is therefore a sort of artifact. Do you want to remove it now?';
		}
		else if(file.videos && file.videos.length){
			confirmText = 'This file is associated with '+file.videos[0].title+'. Do you want to remove this File from the hard drive?';
		}else {
			confirmText = 'This file is not associated with any Video. Do you want to remove this File from the hard drive?';
		}
    alertify.set({ buttonReverse: true, labels: {ok: "Yes", cancel : "Cancel"}});
		alertify.confirm(confirmText, function (confirmed) {
			if(confirmed){
				apiService.video.removeFileFromDisk(file.id, file.path).success(function () {
					_.remove($scope.files, {id: file.id});
					_.remove($scope.files, {path: file.path});
          alertify.success('File deleted.');
				});
			}
		})
	};

	$scope.removeMultipleFiles = function() {
	  if($scope.deletionBulk.length > 0) {
      var confirmText = "This will delete all selected Files. Do you want to proceed?";
      alertify.set({ buttonReverse: true, labels: {ok: "Yes", cancel : "Cancel"}});
      alertify.confirm(confirmText, function (confirmed) {
        if(confirmed){
          var bulk = JSON.stringify($scope.deletionBulk);
          apiService.video.removeMultipleFilesFromDisk(bulk).success(function () {
            $scope.deletionBulk.forEach(file => {
              _.remove($scope.files, {id: file.id});
              _.remove($scope.files, {path: file.path});
            });
            deletionBulk = [];
            alertify.success('Files deleted.');
          });
        }
      });
	  }
	};

	$scope.addToDeletionBulk = function($event, file) {
	  if($event.target.checked) {
      var toBeDeleted = {id: file.id}
      $scope.deletionBulk.push(toBeDeleted);
    } else {
      var index = $scope.deletionBulk.indexOf(file.id);
      $scope.deletionBulk.splice(index, 1);
    }
	};

	$scope.pageChanged = function () {
		var newOffset = $scope.maxPerPage*($scope.pagination.currentPage-1);
		loadFiles({max: $scope.maxPerPage, filter: $scope.listFilter, offset: newOffset});
	};


	$scope.refreshList = function (filter) {
		$scope.listFilter = filter;
		loadFiles({max: $scope.maxPerPage, filter: filter, offset: $scope.offset});
	};


	var loadFiles = function (params) {
		$scope.loading = true;
		$scope.files = [];
		$scope.filesCount = 0;
		apiService.video.listAllFiles(params)
			.success(function (data) {
				$scope.loading = false;
				$scope.files = data.files;
				$scope.filesCount = data.count;
			})
			.error(function () {
				alertify.error('An error occurred.');
			});
	};


	$scope.cleanUpFiles = function(type){
		var message;
		if(type == 'noVideos'){
			message = 'Are you sure you want to proceed? This will delete all file-objects that are missing the corresponding file in the file-system';
		}else if(type == 'noFile'){
			message = 'Are you sure you want to proceed? This will delete all non-associated files from the harddrive';
		}
    alertify.set({ buttonReverse: true, labels: {ok: "Yes", cancel : "Cancel"}});
		alertify.confirm(message, function (confirmed) {
			if(confirmed){
				$scope.loading = true;
				apiService.video.cleanUpFiles(type).success(function () {
					$scope.refreshList('all');
				});
			}
		})
	};



	//Initial Load
	$scope.refreshList('all');
}]);
