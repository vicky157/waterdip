#  Copyright 2022-present, the Waterdip Labs Pvt. Ltd.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

from typing import Dict, List, Optional
from uuid import UUID

from fastapi import Depends

from waterdip.server.db.models.monitors import BaseMonitorDB, MonitorDB
from waterdip.server.db.mongodb import MONGO_COLLECTION_MONITORS, MongodbBackend


class MonitorRepository:
    _INSTANCE = None

    @classmethod
    def get_instance(
        cls, mongodb: MongodbBackend = Depends(MongodbBackend.get_instance)
    ):
        if cls._INSTANCE is None:
            cls._INSTANCE = cls(mongodb=mongodb)
        return cls._INSTANCE

    def __init__(self, mongodb: MongodbBackend):
        self._mongo = mongodb

    def insert_monitor(self, monitor: BaseMonitorDB) -> MonitorDB:
        inserted_monitor = self._mongo.database[MONGO_COLLECTION_MONITORS].insert_one(
            document=monitor.dict()
        )

        created_monitor = self._mongo.database[MONGO_COLLECTION_MONITORS].find_one(
            {"_id": inserted_monitor.inserted_id}
        )

        return BaseMonitorDB(**created_monitor)

    def count_monitors(self, filters: Dict) -> int:
        total = self._mongo.database[MONGO_COLLECTION_MONITORS].count_documents(
            filter=filters
        )
        return total

    def find_monitors(
        self,
        filters: Dict = {},
        sort: List = None,
        skip: int = 0,
        limit: int = 10,
    ) -> List[MonitorDB]:
        monitors = (
            self._mongo.database[MONGO_COLLECTION_MONITORS]
            .find(filters)
            .limit(limit)
            .skip(skip)
        )
        if sort:
            monitors = monitors.sort(sort)

        return [BaseMonitorDB(**monitor) for monitor in monitors]

    def delete_monitor(self, monitor_id: UUID) -> Dict:
        try:
            self._mongo.database[MONGO_COLLECTION_MONITORS].delete_one(
                {"monitor_id": str(monitor_id)}
            )
            return {
                "status": "success",
            }
        except Exception as e:
            return {
                "status": "error",
            }

    def delete_monitors_by_model_id(self, model_id: UUID) -> Dict:
        try:
            self._mongo.database[MONGO_COLLECTION_MONITORS].delete_many(
                {"monitor_identification.model_id": str(model_id)}
            )
            return {
                "status": "success",
            }
        except Exception as e:
            return {
                "status": "error",
            }
