# Changelog

## [1.5.2](https://github.com/derekwinters/chores-web/compare/v1.5.1...v1.5.2) (2026-05-17)


### Bug Fixes

* add x-release-please-version annotation to APP_VERSION ([006e8cb](https://github.com/derekwinters/chores-web/commit/006e8cb2fc8478d392633dc2128ae5dc66575871))
* configure release-please for single repo-wide release ([#257](https://github.com/derekwinters/chores-web/issues/257)) ([28d4058](https://github.com/derekwinters/chores-web/commit/28d405830460cdf8f6bdb0a5fc43dde0891fad4c))
* sync backend APP_VERSION and prevent stale version in DB ([#256](https://github.com/derekwinters/chores-web/issues/256)) ([0584564](https://github.com/derekwinters/chores-web/commit/0584564ffc683d4a55885bb50829b4f1f4ea2b5f))

## [1.5.1](https://github.com/derekwinters/chores-web/compare/v1.5.0...v1.5.1) (2026-05-17)


### Bug Fixes

* restore package.json and switch release-type to node ([#249](https://github.com/derekwinters/chores-web/issues/249)) ([80165be](https://github.com/derekwinters/chores-web/commit/80165be87e35960ecbb4782b0b680b428ec47cc4))
* use valid changelog path for frontend package ([#251](https://github.com/derekwinters/chores-web/issues/251)) ([6efbebc](https://github.com/derekwinters/chores-web/commit/6efbebcc6f8bdc402f64aa625b3af814d165c0a5))

## [1.5.0](https://github.com/derekwinters/chores-web/compare/v1.4.0...v1.5.0) (2026-05-17)


### Features

* Add chore status filtering ([#247](https://github.com/derekwinters/chores-web/issues/247)) ([1c1de37](https://github.com/derekwinters/chores-web/commit/1c1de3737c85cd2fd8f6162545717a877e1e989d))


### Bug Fixes

* DueSoon now only shows upcoming chores ([1c1de37](https://github.com/derekwinters/chores-web/commit/1c1de3737c85cd2fd8f6162545717a877e1e989d)), closes [#246](https://github.com/derekwinters/chores-web/issues/246) [#228](https://github.com/derekwinters/chores-web/issues/228) [#220](https://github.com/derekwinters/chores-web/issues/220)

## [1.4.0](https://github.com/derekwinters/chores-web/compare/v1.3.0...v1.4.0) (2026-05-16)


### Features

* Add chore summary stats tiles to /chores page ([#81](https://github.com/derekwinters/chores-web/issues/81)) ([#221](https://github.com/derekwinters/chores-web/issues/221)) ([a78ff9c](https://github.com/derekwinters/chores-web/commit/a78ff9cc8a030a588d11fc6407713f00ef6ea712))
* Add hex color input and color picker to theme editor ([#113](https://github.com/derekwinters/chores-web/issues/113)) ([#222](https://github.com/derekwinters/chores-web/issues/222)) ([6916947](https://github.com/derekwinters/chores-web/commit/691694740ca46fb45ba743b39f4bde974821713a))
* **ai:** add grill-me skill and doc-aware planning/implementation ([#234](https://github.com/derekwinters/chores-web/issues/234)) ([14b3a59](https://github.com/derekwinters/chores-web/commit/14b3a5956791d6fcd12784f6f9cff2250bf6122d)), closes [#233](https://github.com/derekwinters/chores-web/issues/233)
* Apply unified theme colors across all pages ([#115](https://github.com/derekwinters/chores-web/issues/115)-120) ([#223](https://github.com/derekwinters/chores-web/issues/223)) ([62e7a1b](https://github.com/derekwinters/chores-web/commit/62e7a1bdf01c07dc359e41a8c7338c4b2f514894))
* **chores:** unassign open chores after completion ([#225](https://github.com/derekwinters/chores-web/issues/225)) ([#232](https://github.com/derekwinters/chores-web/issues/232)) ([a4a7207](https://github.com/derekwinters/chores-web/commit/a4a72073833c5810aa1ea5fd9e0bfd5a2c3b5c00))
* Define unified theme color structure (9-color system) ([#114](https://github.com/derekwinters/chores-web/issues/114)) ([#213](https://github.com/derekwinters/chores-web/issues/213)) ([3b35860](https://github.com/derekwinters/chores-web/commit/3b3586031e10a8d5432bf02bc16bd43279f1969d))
* **error-handling:** Improve UI error messages with fallback strategy ([#239](https://github.com/derekwinters/chores-web/issues/239)) ([ce41b09](https://github.com/derekwinters/chores-web/commit/ce41b094a688f0d0e5e5d9839f5138cc3a6649f3)), closes [#155](https://github.com/derekwinters/chores-web/issues/155)
* **frontend:** refine log view with relative timestamps and redesigned badges ([#191](https://github.com/derekwinters/chores-web/issues/191)) ([#237](https://github.com/derekwinters/chores-web/issues/237)) ([96121fe](https://github.com/derekwinters/chores-web/commit/96121feceb41c076d1306f129bf52d6c78d337ca))
* **frontend:** save button feedback for all save actions ([#71](https://github.com/derekwinters/chores-web/issues/71)) ([#238](https://github.com/derekwinters/chores-web/issues/238)) ([05d05cb](https://github.com/derekwinters/chores-web/commit/05d05cbf0ad748f4290967b86361d125884b6f52))
* Improve theme list UX with action icons and color preview ([#122](https://github.com/derekwinters/chores-web/issues/122)) ([#219](https://github.com/derekwinters/chores-web/issues/219)) ([cf8a6e8](https://github.com/derekwinters/chores-web/commit/cf8a6e876b0f97d0e1356beba83964bd83a5fee8))
* Separate personal theme selection from default theme setting ([#121](https://github.com/derekwinters/chores-web/issues/121)) ([#224](https://github.com/derekwinters/chores-web/issues/224)) ([f4b61ec](https://github.com/derekwinters/chores-web/commit/f4b61ec81c11078918f2d1693f05fe41a4dbde16))
* **theme:** Paper default with borderless cards and consistent shadows ([#242](https://github.com/derekwinters/chores-web/issues/242)) ([21b4442](https://github.com/derekwinters/chores-web/commit/21b44425c6144fe4f9b096e2997ffdf9b2ff2f59))


### Bug Fixes

* **ai:** update orchestrator script implement step for doc pre/post work ([#236](https://github.com/derekwinters/chores-web/issues/236)) ([742e10b](https://github.com/derekwinters/chores-web/commit/742e10b2495ceff9f6e913b5d400f7d1c4495542))
* Correct chore assignee filter to respect eligible_people ([#88](https://github.com/derekwinters/chores-web/issues/88)) ([#229](https://github.com/derekwinters/chores-web/issues/229)) ([f316186](https://github.com/derekwinters/chores-web/commit/f316186f18f6424462a5a71ef1386ad6ff5da35a))
* correct points window filtering and dashboard lookup key ([#208](https://github.com/derekwinters/chores-web/issues/208)) ([#210](https://github.com/derekwinters/chores-web/issues/210)) ([f07c2f4](https://github.com/derekwinters/chores-web/commit/f07c2f4da869019716102fff93c19098360bdcc2))
* **frontend:** keep highlight color on expanded chore card ([#226](https://github.com/derekwinters/chores-web/issues/226)) ([#235](https://github.com/derekwinters/chores-web/issues/235)) ([d07de47](https://github.com/derekwinters/chores-web/commit/d07de47fdf099bc21448891e93deb75777e1ae02))
* **frontend:** prevent adjacent column cards from stretching on expand ([#227](https://github.com/derekwinters/chores-web/issues/227)) ([#231](https://github.com/derekwinters/chores-web/issues/231)) ([6a14834](https://github.com/derekwinters/chores-web/commit/6a14834a7ceec49b0e6667224390d311ef063993))
* **frontend:** remove preferences from sidebar navigation ([#230](https://github.com/derekwinters/chores-web/issues/230)) ([cb1c886](https://github.com/derekwinters/chores-web/commit/cb1c886e6242595627ab00b13c6042c8772dbd2f))
* **theme:** Calendar colors on edit screen for light themes ([#241](https://github.com/derekwinters/chores-web/issues/241)) ([2ca8b86](https://github.com/derekwinters/chores-web/commit/2ca8b86dcd65e3f36c671657a66992b1592e98ee))
* **theme:** Reduce pink theme saturation to accent/highlight only ([#240](https://github.com/derekwinters/chores-web/issues/240)) ([b6d9e2b](https://github.com/derekwinters/chores-web/commit/b6d9e2b4074134e36d5d0ee609ac1bb4ea56b167)), closes [#112](https://github.com/derekwinters/chores-web/issues/112)


### Documentation

* Complete documentation audit and accuracy updates ([#243](https://github.com/derekwinters/chores-web/issues/243)) ([#244](https://github.com/derekwinters/chores-web/issues/244)) ([b4b2f4f](https://github.com/derekwinters/chores-web/commit/b4b2f4fcbf137b0acf574a7d243613c75fde587b))


### CI/CD

* **release:** Add release-please configuration ([#245](https://github.com/derekwinters/chores-web/issues/245)) ([f8ba8bb](https://github.com/derekwinters/chores-web/commit/f8ba8bbdfcbde3c207e5743c1d394914d9e0d3d5))

## [1.3.0](https://github.com/derekwinters/chores-web/compare/v1.2.0...v1.3.0) (2026-05-10)


### Features

* Add periodic update checker with GitHub API integration ([#37](https://github.com/derekwinters/chores-web/issues/37)) ([#175](https://github.com/derekwinters/chores-web/issues/175)) ([457e7e8](https://github.com/derekwinters/chores-web/commit/457e7e8e1d43e6f8c903d9763a41568a0e8860a0))
* Admin database management dashboard for PointsLog ([#97](https://github.com/derekwinters/chores-web/issues/97)) ([#200](https://github.com/derekwinters/chores-web/issues/200)) ([128c1f5](https://github.com/derekwinters/chores-web/commit/128c1f56f7c014d17e521d4c61f12385b59f2adb))
* Log user goal value changes and unlogged chore modifications ([#107](https://github.com/derekwinters/chores-web/issues/107)) ([#198](https://github.com/derekwinters/chores-web/issues/198)) ([c8b59a2](https://github.com/derekwinters/chores-web/commit/c8b59a22578df87d5ced338c1b99f432e13fad38))
* Make log entries clickable to expand inline as detail row ([#179](https://github.com/derekwinters/chores-web/issues/179)) ([#190](https://github.com/derekwinters/chores-web/issues/190)) ([095b0b9](https://github.com/derekwinters/chores-web/commit/095b0b9b0441b3522a06646279348cbc98600f74))
* Reduce log columns on mobile to prevent horizontal scrolling ([#109](https://github.com/derekwinters/chores-web/issues/109)) ([#178](https://github.com/derekwinters/chores-web/issues/178)) ([c6a90e3](https://github.com/derekwinters/chores-web/commit/c6a90e3de0af2284cef001b692d76479e4bf1254))
* Reorganize admin panel into separate pages by section ([#111](https://github.com/derekwinters/chores-web/issues/111)) ([#197](https://github.com/derekwinters/chores-web/issues/197)) ([51431e9](https://github.com/derekwinters/chores-web/commit/51431e923df2491d61129a33ba5136f7a9d3e5e7))
* Separate actor and content in chore change logs ([#108](https://github.com/derekwinters/chores-web/issues/108)) ([#206](https://github.com/derekwinters/chores-web/issues/206)) ([d96eb69](https://github.com/derekwinters/chores-web/commit/d96eb690dbc8bb77f89173dccf5bba84e9105058))


### Bug Fixes

* Improve agent workflow with visuals ([#185](https://github.com/derekwinters/chores-web/issues/185)) ([dd4e9a4](https://github.com/derekwinters/chores-web/commit/dd4e9a4a16d2bf172ed7640221d5621b777d48ee))
* Keep points and due grids at 2 columns on mobile ([#184](https://github.com/derekwinters/chores-web/issues/184)) ([#187](https://github.com/derekwinters/chores-web/issues/187)) ([a9c7863](https://github.com/derekwinters/chores-web/commit/a9c78631d026a8a794608c7d3518b174d6d4701d))
* Log actual user instead of system when skipping chores ([#154](https://github.com/derekwinters/chores-web/issues/154)) ([#180](https://github.com/derekwinters/chores-web/issues/180)) ([57f2808](https://github.com/derekwinters/chores-web/commit/57f280802aa3cb7ca7befc921d21a8de70160f7d))
* Normalize boolean config storage and export coercion ([#162](https://github.com/derekwinters/chores-web/issues/162)) ([#189](https://github.com/derekwinters/chores-web/issues/189)) ([4e11be9](https://github.com/derekwinters/chores-web/commit/4e11be9b7e57f785329f0746cb08088a78001a07))
* Populate settings values on Admin Panel load ([#177](https://github.com/derekwinters/chores-web/issues/177)) ([#188](https://github.com/derekwinters/chores-web/issues/188)) ([4a440fd](https://github.com/derekwinters/chores-web/commit/4a440fd7d3a7642b4434446ca0b79e5eb2dca4cf))
* resync sequences and stamp initial revision on DuplicateTable ([#193](https://github.com/derekwinters/chores-web/issues/193)) ([#194](https://github.com/derekwinters/chores-web/issues/194)) ([910ca5d](https://github.com/derekwinters/chores-web/commit/910ca5d1fdf2eb863de7241abf42644078f5ddc9))
* Show state diagram on transitions, add test planning to plan agent ([#192](https://github.com/derekwinters/chores-web/issues/192)) ([8e6fa8b](https://github.com/derekwinters/chores-web/commit/8e6fa8bc28d13775ac1bf059b892892a18acff87))
* Standardize actor logging to use usernames and distinguish schedule from system ([#135](https://github.com/derekwinters/chores-web/issues/135)) ([#182](https://github.com/derekwinters/chores-web/issues/182)) ([ae43689](https://github.com/derekwinters/chores-web/commit/ae436893b17ad80e9d8663f827bb7a8aa44348a7))

## [1.2.0](https://github.com/derekwinters/chores-web/compare/v1.1.0...v1.2.0) (2026-05-08)


### Features

* Add "Update In Progress" UI for database startup/migrations ([#157](https://github.com/derekwinters/chores-web/issues/157)) ([#160](https://github.com/derekwinters/chores-web/issues/160)) ([eba866f](https://github.com/derekwinters/chores-web/commit/eba866f17e4c406343a04ab36a708738956302c2))
* Add configurable due soon threshold for flexible task filtering ([#163](https://github.com/derekwinters/chores-web/issues/163)) ([#174](https://github.com/derekwinters/chores-web/issues/174)) ([1de0dfa](https://github.com/derekwinters/chores-web/commit/1de0dfaf079eab2ca634192a34a78b21ff400864))
* Add database status tracking and /db-status endpoint ([#164](https://github.com/derekwinters/chores-web/issues/164)) ([#165](https://github.com/derekwinters/chores-web/issues/165)) ([06cff38](https://github.com/derekwinters/chores-web/commit/06cff38bc0211da170e0ea00fe7450c014db7375))
* Add github-issue-categorize skill ([#144](https://github.com/derekwinters/chores-web/issues/144)) ([#152](https://github.com/derekwinters/chores-web/issues/152)) ([ff0c130](https://github.com/derekwinters/chores-web/commit/ff0c1306be43770088d671ad07b62f26a91d09fc))
* Add github-issue-implementation-orchestrator agent ([#168](https://github.com/derekwinters/chores-web/issues/168)) ([543072d](https://github.com/derekwinters/chores-web/commit/543072dd5e0958b54197cf9a55f98dfbdeb3f15f))
* Add github-issue-plan-orchestrator agent for comprehensive issue planning ([#167](https://github.com/derekwinters/chores-web/issues/167)) ([f02ee2c](https://github.com/derekwinters/chores-web/commit/f02ee2c41d54dc2c9396783b795fe17268afc2d0))
* Set up Alembic migrations for database schema management ([#158](https://github.com/derekwinters/chores-web/issues/158)) ([#159](https://github.com/derekwinters/chores-web/issues/159)) ([fb5d447](https://github.com/derekwinters/chores-web/commit/fb5d447063fd00c5ae8c42b577ca243939ad78e6))


### Bug Fixes

* Add documentation validation workflow for PR checks ([#171](https://github.com/derekwinters/chores-web/issues/171)) ([6a16a3a](https://github.com/derekwinters/chores-web/commit/6a16a3a64ff7e2034731060700c331d3dd388e84))
* Add frontmatter to agent file for Claude Code visibility ([70f5fe1](https://github.com/derekwinters/chores-web/commit/70f5fe1a5c5f4c1281b6d44d67d8763bdd69ae74))
* Add frontmatter to agent file for Claude Code visibility ([#166](https://github.com/derekwinters/chores-web/issues/166)) ([c9d67bd](https://github.com/derekwinters/chores-web/commit/c9d67bd6ef2372743ff4671f62c7ab1a8f417e3f))
* Add missing permissions for Docker push to ghcr.io ([#169](https://github.com/derekwinters/chores-web/issues/169)) ([abf8bf2](https://github.com/derekwinters/chores-web/commit/abf8bf225f8e79cfffeb8859493fc06274d3df63))
* Correct gh-pages deployment to handle history conflicts ([#173](https://github.com/derekwinters/chores-web/issues/173)) ([b586160](https://github.com/derekwinters/chores-web/commit/b586160ff71e1a6426365862bd6f2d7ecf09b22d))
* Initialize database sequences to prevent primary key constraint violations ([#156](https://github.com/derekwinters/chores-web/issues/156)) ([#161](https://github.com/derekwinters/chores-web/issues/161)) ([bbaf2dc](https://github.com/derekwinters/chores-web/commit/bbaf2dc5b85b1d85c67b65ec81b8a4479f2669a5))
* Resolve documentation build failures ([#170](https://github.com/derekwinters/chores-web/issues/170)) ([b2cdaae](https://github.com/derekwinters/chores-web/commit/b2cdaae9713bf7a08d6dd891fddbb8443812153e))

## [1.1.0](https://github.com/derekwinters/chores-web/compare/v1.0.0...v1.1.0) (2026-04-26)


### Features

* Add frontend admin UI for redeeming points ([#95](https://github.com/derekwinters/chores-web/issues/95)) ([#127](https://github.com/derekwinters/chores-web/issues/127)) ([ce0458b](https://github.com/derekwinters/chores-web/commit/ce0458b2ebb3147d6928ecbd217f3039929e68d3))
* Add redemption history display in user detail ([#126](https://github.com/derekwinters/chores-web/issues/126)) ([3f20cb8](https://github.com/derekwinters/chores-web/commit/3f20cb8758db4e0b2ece63c535f8cb8fa693b586))
* Add total points tracking and redemption API ([#124](https://github.com/derekwinters/chores-web/issues/124)) ([55cc745](https://github.com/derekwinters/chores-web/commit/55cc74598657d29212e7f48bd8933da4a4cd4b05))

## 1.0.0 (2026-04-26)


### Features

* Add age-based chore filter and remove automatic assignee filtering ([#68](https://github.com/derekwinters/chores-web/issues/68)) ([#70](https://github.com/derekwinters/chores-web/issues/70)) ([b764cc8](https://github.com/derekwinters/chores-web/commit/b764cc8310248dbc249ac86be92bf8ad94800116))
* Add assignment validation function ([#61](https://github.com/derekwinters/chores-web/issues/61)) ([#64](https://github.com/derekwinters/chores-web/issues/64)) ([30f1ec1](https://github.com/derekwinters/chores-web/commit/30f1ec15f16b8774d8719b7730e8226be77c95ce))
* add chore assignee filtering ([#33](https://github.com/derekwinters/chores-web/issues/33)) ([71d46ce](https://github.com/derekwinters/chores-web/commit/71d46cefee53a8896ec7cc977a5ed077110c42e1))
* Add complete and skip buttons to chores ([#47](https://github.com/derekwinters/chores-web/issues/47)) ([f412d1e](https://github.com/derekwinters/chores-web/commit/f412d1edaae454631c702bbe54d12da446314d8f))
* Add configurable app-wide timezone ([#73](https://github.com/derekwinters/chores-web/issues/73)) ([0ed380f](https://github.com/derekwinters/chores-web/commit/0ed380fb6269ff039a25cae3cd213f0f1f35da9d))
* Add github-issue-review skill and rename to github-issue-assign ([#54](https://github.com/derekwinters/chores-web/issues/54)) ([ebad7b2](https://github.com/derekwinters/chores-web/commit/ebad7b2b1d38b80ba9802f10a0b84aa8137105b1))
* add history links to chore and user cards ([#28](https://github.com/derekwinters/chores-web/issues/28)) ([7e6a64f](https://github.com/derekwinters/chores-web/commit/7e6a64f49ad42151b2557be65406c8ced691f5ef))
* Add import/export UI for data management ([#85](https://github.com/derekwinters/chores-web/issues/85)) ([4bbd414](https://github.com/derekwinters/chores-web/commit/4bbd414ebddac070d98d8c9b1e46a843b695bcda))
* Add multi-column layout to chores list ([#49](https://github.com/derekwinters/chores-web/issues/49)) ([48f5233](https://github.com/derekwinters/chores-web/commit/48f5233121385003d3fc8cd280e2d0fe9e8707cf))
* Add points field to Person model and admin update API ([#84](https://github.com/derekwinters/chores-web/issues/84)) ([#87](https://github.com/derekwinters/chores-web/issues/87)) ([c21b52e](https://github.com/derekwinters/chores-web/commit/c21b52e6475c899cb4c11dae8c3640010531891b))
* Add Profile and Settings options to avatar menu ([#82](https://github.com/derekwinters/chores-web/issues/82)) ([cc4f035](https://github.com/derekwinters/chores-web/commit/cc4f035b2fe9d13f9471755fb8667e84d98b9fdc))
* Add responsive column layout to users page with admin/member sections ([#39](https://github.com/derekwinters/chores-web/issues/39)) ([#60](https://github.com/derekwinters/chores-web/issues/60)) ([3a38e83](https://github.com/derekwinters/chores-web/commit/3a38e83d6df0a04d447107d740a4a9ac6092e92f))
* Add skills system and migrate existing commands ([#48](https://github.com/derekwinters/chores-web/issues/48)) ([b99d16f](https://github.com/derekwinters/chores-web/commit/b99d16f73b4bcad154a553725fd791e8598e9989))
* Add URL query param filtering to /logs ([#26](https://github.com/derekwinters/chores-web/issues/26)) ([57b4602](https://github.com/derekwinters/chores-web/commit/57b460285868628148e3c85f7bdcf1575e529d7f))
* Allow edit of assignee in chore ([#23](https://github.com/derekwinters/chores-web/issues/23)) ([00a5fb3](https://github.com/derekwinters/chores-web/commit/00a5fb3f51db2a060b6aefd510b83e421fd7809d))
* Change assignee filter to multi-select dropdown ([#55](https://github.com/derekwinters/chores-web/issues/55)) ([#56](https://github.com/derekwinters/chores-web/issues/56)) ([a04e625](https://github.com/derekwinters/chores-web/commit/a04e62538bf5b9eccc9dc7e61d5ed5c413d9229f))
* **chore-card:** collapse/expand card with left accent bar ([#44](https://github.com/derekwinters/chores-web/issues/44)) ([67f5032](https://github.com/derekwinters/chores-web/commit/67f503270429c908c0face07df8f80316338b5ec))
* Consolidate due now/soon counts to include assigned and unassigned chores ([#35](https://github.com/derekwinters/chores-web/issues/35)) ([#58](https://github.com/derekwinters/chores-web/issues/58)) ([6516115](https://github.com/derekwinters/chores-web/commit/6516115fc0dad17f4842a6fecc78e41574393af7))
* Default chores page to user-focused view ([#21](https://github.com/derekwinters/chores-web/issues/21)) ([#57](https://github.com/derekwinters/chores-web/issues/57)) ([df30bbf](https://github.com/derekwinters/chores-web/commit/df30bbf4323acc9935986c7ecb306db9115a45ed))
* Initial commit ([bbd795a](https://github.com/derekwinters/chores-web/commit/bbd795a1502fc46247d90b579993ac8da61c1a7b))
* Integrate assignment validation into chore endpoints ([#62](https://github.com/derekwinters/chores-web/issues/62)) ([#65](https://github.com/derekwinters/chores-web/issues/65)) ([6115c12](https://github.com/derekwinters/chores-web/commit/6115c125e00b68dfafd3d0bf3330e1ab7b77b0a5))
* Replace dashboard due-soon lists with links to filtered chores views ([#34](https://github.com/derekwinters/chores-web/issues/34)) ([f41902c](https://github.com/derekwinters/chores-web/commit/f41902c8244780102b9f60102de756bee5fab5d6))
* Reset chore state when next_due is updated ([#40](https://github.com/derekwinters/chores-web/issues/40)) ([#66](https://github.com/derekwinters/chores-web/issues/66)) ([cf527a7](https://github.com/derekwinters/chores-web/commit/cf527a786bb0443e7cbbec671571ff9d35eb4bde))
* route user detail and filter activity history ([#25](https://github.com/derekwinters/chores-web/issues/25)) ([7ef9764](https://github.com/derekwinters/chores-web/commit/7ef976495463966522bb7daabbfa7dd8b565bbfa))
* sort chores by next due date ([#30](https://github.com/derekwinters/chores-web/issues/30)) ([7b2362e](https://github.com/derekwinters/chores-web/commit/7b2362e4172af5bf1daf52321a5ff186a3c43980))
* sync chore filters with URL params ([#29](https://github.com/derekwinters/chores-web/issues/29)) ([9456eb1](https://github.com/derekwinters/chores-web/commit/9456eb1d8de00698a316ba89a41bb9d92037e7d1))


### Bug Fixes

* Add daysFromNow filter to Due Soon link and rename Manage to Chores ([#74](https://github.com/derekwinters/chores-web/issues/74)) ([#75](https://github.com/derekwinters/chores-web/issues/75)) ([a6c8368](https://github.com/derekwinters/chores-web/commit/a6c83682e2e008523caff8cc2aa0ceb18f1e0805))
* Allow unassigning chores by preserving explicit null values ([#69](https://github.com/derekwinters/chores-web/issues/69)) ([#72](https://github.com/derekwinters/chores-web/issues/72)) ([cd626be](https://github.com/derekwinters/chores-web/commit/cd626bed760d9a4c2a78ec5b2ae34b2e99e566c1))
* **chore-form:** set default points to 1 instead of 0 ([#45](https://github.com/derekwinters/chores-web/issues/45)) ([58caaed](https://github.com/derekwinters/chores-web/commit/58caaed09609d516a1414c425565ad652b557694))
* Replace calendar dialog with themed Material-UI DatePicker ([#36](https://github.com/derekwinters/chores-web/issues/36)) ([#52](https://github.com/derekwinters/chores-web/issues/52)) ([3e23e33](https://github.com/derekwinters/chores-web/commit/3e23e33717e16ee8262c717e75b0c60ea079245b))
* Signin improvements - prevent autocapitalization and page reload on error ([#42](https://github.com/derekwinters/chores-web/issues/42)) ([#59](https://github.com/derekwinters/chores-web/issues/59)) ([a18d966](https://github.com/derekwinters/chores-web/commit/a18d966642603e7cf14daae9457b837a4d4ca7f4))
* Theme stable across reload ([#24](https://github.com/derekwinters/chores-web/issues/24)) ([cf13839](https://github.com/derekwinters/chores-web/commit/cf13839ade5c7af38576845afc4fd11e7dc0b666))
* Use dynamic viewport height for sidebar on tablets ([#89](https://github.com/derekwinters/chores-web/issues/89)) ([#91](https://github.com/derekwinters/chores-web/issues/91)) ([9735dda](https://github.com/derekwinters/chores-web/commit/9735dda967b3ad3b4c6211aba6cb6d555f046c8a))
* UserAvatarMenu dropdown z-index behind chores cards ([#76](https://github.com/derekwinters/chores-web/issues/76)) ([#90](https://github.com/derekwinters/chores-web/issues/90)) ([8b860a7](https://github.com/derekwinters/chores-web/commit/8b860a72078de6c3d9b8b349cf1602cf6a2f20cb))
