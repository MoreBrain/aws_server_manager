The goal of this project is to provide a web GUI for developers to start, stop, monitor and manage aws server instances in different locations in Europe.

The application is docker based, frontend with react, backend with fastapi and nginx.

There should be a list of all available aws servers (running, stopped, etc) and related data (region, instance type, costs/hour, reserved by, ...)
There should be the possibility to reserve a server on the next day to start at a defined time. If the server cannot be started due to sufficient capacity, the backend should retry to start the instance every minute.
There should be a default field with 18:00 to stop the server to save costs. This field can be changed if needed (to a time or to don't stop at all).


