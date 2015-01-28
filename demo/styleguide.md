# Overview

This is a demo of [kss-node](https://github.com/kss-node/kss-node)'s built-in style guide generator.

This software is a Node.js implementation of [Knyle Style Sheets](https://github.com/kneath/kss) (KSS), "a documentation syntax for CSS" that's intended to have syntax readable by humans *and* machines. Hence, the kss-node software can be used to create a "living style guide".

1. Write human-readable documentation using "KSS syntax" comments.
2. Have `kss-node` auto-generate a style guide from your stylesheets.

This site is generated with the `kss-node` command-line tool used on this [demo project](https://github.com/kss-node/kss-node/tree/master/demo).

Check out the [project on Github](https://github.com/kss-node/kss-node) for more information about the code, or read the spec for details on how to document your stylesheets for KSS.

# KSS Specification

Compared to the default Ruby implementation at kneath/kss, kss-node includes a few optional features to allow for completely automated style guide generation out of the box. The kss-node specifics are detailed in this annotated copy of the [KSS spec](https://github.com/kss-node/kss/blob/spec/SPEC.md).
