# Git 使用

1. 创建本地个人分支，在这上面工作，不要直接在dev上工作

2. 每次工作前，先从dev上pull最新代码，然后再push到个人分支

3. 提交代码时，先提交到个人分支，然后再发起pull request，merge到dev上

```bash
git checkout dev
git pull
git checkout -b your_branch
git push origin your_branch
```