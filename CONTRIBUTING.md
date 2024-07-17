# Contributing to Monarch

If you have a question about Monarch (not a bug report) please post it to [StackOverflow](http://stackoverflow.com/questions/tagged/monarch)

## Reporting bugs

* Before opening a new issue, look for existing [issues](https://github.com/princecodes247/monarch/issues) to avoid duplication. If the issue does not yet exist, [create one](https://github.com/princecodes247/monarch/issues/new).
  * Please post any relevant code samples, preferably a standalone script that
  reproduces your issue. Do **not** describe your issue in prose. **Show your code.**
  * If the bug involves an error, please post the stack trace.
  * Please post the version of Monarch and MongoDB that you're using.
  * Please write bug reports in JavaScript (ES5, ES6, etc) or TypeScript that runs in Node.js, **not** CoffeeScript, JSX, etc.

## Requesting new features

* Before opening a new issue, look for existing [issues](https://github.com/princecodes247/monarch/issues) to avoid duplication. If the issue does not yet exist, [create one](https://github.com/princecodes247/monarch/issues/new).
* Please describe a use case for it
* Please include test cases if possible

## Fixing bugs / Adding features

* Before starting to write code, look for existing [issues](https://github.com/princecodes247/monarch/issues). That way you avoid working on something that might not be of interest or that has been addressed already in a different branch. You can create a new issue [here](https://github.com/princecodes247/monarch/issues/new)..
  * *The source of this project is written in TypeScript, not CoffeeScript or JavaScript. Please write your bug reports in JavaScript or TypeScript*.
* Fork the [repo](https://github.com/princecodes247/monarch) *or* for small documentation changes, navigate to the source on github and click the [Edit](https://github.com/blog/844-forking-with-the-edit-button) button.
* Follow the general coding style of the rest of the project:
  * 2 space tabs
  * no trailing whitespace
  * inline documentation for new methods, class members, etc.
  * 1 space between conditionals, no space before function parenthesis
    * `if (..) {`
    * `for (..) {`
    * `while (..) {`
    * `function(err) {`
* Write tests and make sure they pass (tests are in the [test](https://github.com/princecodes247/monarch/tree/master/test) directory).

## Running the tests

* Open a terminal and navigate to the root of the project
* execute `npm install` to install the necessary dependencies
* execute `npm test` to run the tests (we're using [vitest](http://vitest.dev/))
<!-- 
## Documentation

To contribute to the [API documentation](http://www.google.com) just make your changes to the inline documentation of the appropriate [source code](http://www.google.com) in the master branch and submit a [pull request](https://help.github.com/articles/using-pull-requests/). You might also use the github [Edit](https://github.com/blog/844-forking-with-the-edit-button) button.

To contribute to the [guide](http://www.google.com) or [quick start](http://www.google.com) docs, make your changes to the appropriate `.pug` / `.md` files in the [docs](http://www.google.com) directory of the master branch and submit a pull request. Again, the [Edit](https://github.com/blog/844-forking-with-the-edit-button) button might work for you here.

If you'd like to preview your documentation changes, first commit your changes to your local master branch, then execute:

* `npm install`
* `npm run docs:view`

Visit `http://127.0.0.1:8089` and you should see the docs with your local changes. Make sure you `npm run docs:clean` before committing, because automated generated files to `docs/*` should **not** be in PRs.

### Documentation Style Guidelines

There are some guidelines to keep the style for the documentation consistent:

* All links that refer to some other file in the monarch documentation needs to be relative without a prefix unless required (use `guide.html` over `./guide.html` or `/docs/guide.html`) -->

## Financial contributions

We also welcome financial contributions.

## Credits

### Contributors

Thank you to all the people who have already contributed to monarch!
<a href="https://github.com/princecodes247/monarch/graphs/contributors"><img src="https://opencollective.com/monarch/contributors.svg?width=890" alt="Monarch contributors" /></a>

### Backers

Thank you to all our backers! [[Become a backer](https://opencollective.com/monarch#backer)]

<a href="https://opencollective.com/monarch#backers" target="_blank"><img src="https://opencollective.com/monarch/backers.svg?width=890" alt="Monarch backers"></a>