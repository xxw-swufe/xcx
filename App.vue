<script>
	import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js';
	export default {
		onLaunch: function() {
			console.log('App Launch')
			uniIdPageInit().catch(err => {
				console.log('uniIdPageInit 超时或失败，已跳过', err)
			})
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
