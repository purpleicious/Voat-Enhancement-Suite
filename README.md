# Voat Enhancement Suite

Voat Enhancement Suite (or VES) is a userscript designed to enhance the user experience of [Voat][voat].

News, discussions, and general help can be found on VES's official subverse, [/v/Enhancement][subverse].

## Introduction

Many features found in Reddit Enhancement Suite are already built into Voat's user experience. However, there are some features Voat does not have (keyboard navigation, new comment highlighting, &c). VES intends to add those features and more.

A few things:

- Ideas and code are both welcome contributions.
- VES bugs interfering with Voat may be common (or uncommon) depending on many factors.
- VES's source code is split into two main branches. `master` is the most stable branch, and `dev` is where new features are added and tested. Before installing from `dev`, understand that it may be broken.

Regardless of VES performance, I hope you enjoy it.

Thank you!

## Development

If you have JavaScript/jQuery experience (or would like some), fork VES and tinker around. If you optimize a module, create a new one, or if you're willing to share some code that you've thrown together, create a GitHub issue or submit to [/v/Enhancement][subverse].

Above all, any contributions to VES will be graciously credited!

#### Getting Started

1. Install [Node.js](https://nodejs.org/).
2. Install [Grunt's CLI](http://gruntjs.com/getting-started) globally.
3. Fork VES on GitHub.
4. Create a topic branch based on the `dev` branch.
	- Avoid changing the `master` branch as it likely will not reflect the current state of VES.
	- To get going quickly: `git checkout -b dev/my-feature dev` to create a branch `dev/my-feature` based on `dev`
5. Install & update all of VES's dependencies using `npm install`.
6. Build the full script with `grunt`.
	- Build continuously with `grunt watch`.
7. Make logical, incremental commits of your changes.
	- If possible, install [JSHint](http://jshint.com/install/) and [EditorConfig](http://editorconfig.org/) to help with code quality and consistency while working.

## Installation

VES should be compatible across all operating systems and most userscript implementations. Below are instructions for the two browsers VES is officially tested on.

#### Chrome

1. If you do not have `Tampermonkey` installed:
	1. Install `Tampermonkey`.
2. Install VES.

#### Firefox

1. If you do not have `Greasemonkey` installed:
	1. Install `Greasemonkey`,
	2. Restart Firefox.
2. Install VES.

## [Download][dl]

[dl]: https://github.com/travis-g/Voat-Enhancement-Suite/raw/master/builds/voat-enhancement-suite.user.js
[voat]: https://voat.co/
[subverse]: https://voat.co/v/Enhancement/
