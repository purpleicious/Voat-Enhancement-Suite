# How to contribute

Ideas for Voat Enhancement Suite (VES) are extremely desired, since VES is in such an early development phase. Any ideas will likely have more ideas built off of them, sparking the desire for more features, ad infinitum. To ensure ideas make it into VES and get the attention they deserve, this file outlines some basic guidelines.

## VES Core vs Modules

The core of VES is a set of utilities and load scripts set in place to create the individual features of modules. To make sure that the modules reach their full potential, I outlined some key aspects of them:

+ Modules should be independent.
+ Modules should accomplish everything necessary for one feature.
+ Modules should be efficiently written.

To do so, the core must be written carefully to allow this. Streamlining the code must be done to ensure that VES can run across platforms on systems with unique drawbacks (memory limitations, processing power, &c). Please keep usability in mind when creating modules.

## Filing Issues

+ To ensure issues are approached individually and quickly, please tag the issue appropriately.
+ If there is an issue related to yours, please reference the issue in the description.

## Getting Started

+ Make sure you have a GitHub account,
+ Submit a ticket if your issue is not a duplicate.
  * If your issue is a bug, please clearly outline the steps to reproduce it. This may include device, browser, VES version, or other information.
  * Please be open to communication! The more communication that can take place the faster the issue will be fixed.
+ Fork the repository if you are capable and willing to attempt to fix the issue.

## Making Changes

+ As (currently) VES is one file (core and modules) please create a topic branch.
  * Again, avoid changing the master branch!
+ lint `voat-enhancement-suite.user.js` with JSHint.
  * Fix missing semicolons, comparison operator issues, &c. 
+ Make intelligently separated commits.
+ Test to make sure that no features were broken by the fix.

## Submitting Changes

+ Push your changes to the topic branch of your forked repository.
+ Submit a pull request to travis-g/Voat-Enhancement-Suite.
+ Your code will be reviewed and possibly further tested before being merged.
