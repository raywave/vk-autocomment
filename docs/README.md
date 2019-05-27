# Документация по работе с 'vk-autocomment'

## Установка

Установка у 'vk-autocomment' довольно простая, необходимо иметь установленный [Node.JS](https://nodejs.org/en/) и скачанный скрипт для автоматического комментирования, сделать это можно нажав на кнопку 'Clone or download' -> 'Download ZIP' или установив скрипт с помощью *GIT*, но с этим Вы сможете разобраться сами.

После скачивания скрипта, необходимо установить прикладные библиотеки, для того, чтоб скрипт работал, сделать это можно открыв терминал (cmd.exe на Windows) и введя в него следующую команду:

```bash
npm i --only=prod --no-audit --no-progress
```

После завершения установки необходимо запустить скрипт, просто откройте `start.bat` или `start.sh` в зависимости от вашей операционной системы.

После чего, закройте скрипт и откройте появившийся файл `config.json` с помощью любого текстового редактора и настройте его.

```json
{
  "token": "62210cbsm0k17gr4wc938533765dbb1d81590dxd4e9d90ef5ea7783d3a5aed1173z4e89a654877c6ade197ef",
  "links": [
    "https://vk.com/id1",
    "apiclub"
  ],
  "messages": [
    "test message [0]",
    "test message [1]"
  ],
  "time": 1000
}
```

|Опция   |Описание                                                 |
|-       |-                                                        |
|token   |[Токен пользователя ВКонтакте](https://vkhost.github.io/)|
|links   |Массив ссылок / ID на сообщества / страниц               |
|messages|Массив случайных комментариев                            |
|time    |Время для обновления ленты ВКонтакте (в миллисекундах)   |

## Запуск

Инструкция по запуску уже была ранее, но повторить её еще раз не будет проблемой.

Для запуска просто откройте `start.bat` или `start.sh` в зависимости от вашей операционной системы.